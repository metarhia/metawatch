'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const DEFAULT_WATCH_TIMEOUT = 5000;

class DirectoryWatcher extends EventEmitter {
  #watchers = new Map();
  #timeout = DEFAULT_WATCH_TIMEOUT;
  #timer = null;
  #queue = new Map();
  #closed = false;

  constructor(options = {}) {
    super();
    const { timeout } = options;
    if (timeout !== undefined) this.#timeout = timeout;
  }

  close() {
    this.#closed = true;
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    const watchers = this.#watchers.values();
    for (const watcher of watchers) if (watcher) watcher.close();
    this.#watchers.clear();
    this.#queue.clear();
  }

  #post(eventName, filePath) {
    if (this.#timer) clearTimeout(this.#timer);
    this.#queue.set(filePath, eventName);
    if (this.#timeout === 0) return void this.#sendQueue();
    this.#timer = setTimeout(() => {
      if (this.#timer) {
        clearTimeout(this.#timer);
        this.#timer = null;
      }
      this.#sendQueue();
    }, this.#timeout);
  }

  #sendQueue() {
    if (this.#queue.size === 0) return;
    const queue = [...this.#queue.entries()];
    this.#queue.clear();
    this.emit('before', queue);
    for (const [filePath, event] of queue) {
      this.emit(event, filePath);
    }
    this.emit('after', queue);
  }

  #watchDirectory(targetPath) {
    if (this.#closed) return;
    const existing = this.#watchers.get(targetPath);
    if (existing) return;
    const watcher = fs.watch(targetPath, (event, fileName) => {
      const target = targetPath.endsWith(path.sep + fileName);
      const filePath = target ? targetPath : path.join(targetPath, fileName);
      fs.stat(filePath, (error, stats) => {
        if (error) {
          if (error.code === 'ENOENT') {
            this.unwatch(filePath);
            return void this.#post('delete', filePath);
          }
          return void this.emit('error', error);
        }
        if (stats.isDirectory()) this.watch(filePath);
        if (filePath !== targetPath) this.#post('change', filePath);
      });
    });
    watcher.on('error', (error) => this.emit('error', error));
    this.#watchers.set(targetPath, watcher);
  }

  watch(targetPath) {
    if (this.#closed) return;
    const watcher = this.#watchers.get(targetPath);
    if (watcher) return;
    this.#watchers.set(targetPath, null);
    const options = { withFileTypes: true };
    fs.readdir(targetPath, options, (error, files) => {
      if (error) {
        this.#watchers.delete(targetPath);
        return void this.emit('error', error);
      }
      for (const file of files) {
        if (file.isDirectory()) {
          const dirPath = path.join(targetPath, file.name);
          this.watch(dirPath);
        }
      }
      this.#watchDirectory(targetPath);
    });
  }

  unwatch(targetPath) {
    const watcher = this.#watchers.get(targetPath);
    if (!watcher) return;
    this.#watchers.delete(targetPath);
    if (watcher) watcher.close();
  }
}

module.exports = { DirectoryWatcher };

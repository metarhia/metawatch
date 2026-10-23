'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const DEFAULT_WATCH_TIMEOUT = 5000;

// Normalize path and drop trailing separator: './src/' -> 'src'
const normalize = (filePath) => path.join(filePath, '.');

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
    for (const watcher of watchers) watcher.close();
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
    const watcher = fs.watch(targetPath, (event, fileName) => {
      if (this.#closed) return;
      if (!fileName) return;
      const isSamePath = targetPath.endsWith(`${path.sep}${fileName}`);
      let filePath = path.join(targetPath, fileName);
      if (isSamePath) filePath = targetPath;
      fs.stat(filePath, (error, stats) => {
        if (this.#closed) return;
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

  watch(dirPath) {
    if (this.#closed) return;
    const targetPath = normalize(dirPath);
    if (this.#watchers.has(targetPath)) return;
    // Placeholder until scan completes, identifies this watch() call
    const pending = { close() {} };
    this.#watchers.set(targetPath, pending);
    const options = { withFileTypes: true };
    fs.readdir(targetPath, options, (error, files) => {
      if (this.#watchers.get(targetPath) !== pending) return;
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

  unwatch(dirPath) {
    const targetPath = normalize(dirPath);
    if (!this.#watchers.has(targetPath)) return;
    const prefix = path.join(targetPath, path.sep);
    for (const [watchedPath, watcher] of this.#watchers) {
      if (watchedPath !== targetPath && !watchedPath.startsWith(prefix)) {
        continue;
      }
      this.#watchers.delete(watchedPath);
      watcher.close();
    }
  }
}

module.exports = { DirectoryWatcher };

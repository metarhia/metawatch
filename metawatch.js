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

  #remove(filePath) {
    this.unwatch(filePath);
    this.#post('delete', filePath);
  }

  #watchDirectory(targetPath) {
    const name = path.basename(targetPath);
    const watcher = fs.watch(targetPath, (event, fileName) => {
      // fileName is not guaranteed; report targetPath itself without it
      const filePath = fileName ? path.join(targetPath, fileName) : targetPath;
      fs.stat(filePath, (error, stats) => {
        // Drop results after unwatch() or close()
        if (this.#watchers.get(targetPath) !== watcher) return;
        if (!error) {
          if (stats.isDirectory()) {
            // Directory may be re-created, drop watchers of the old one
            if (event === 'rename') this.unwatch(filePath);
            this.watch(filePath);
          }
          return void this.#post('change', filePath);
        }
        if (error.code !== 'ENOENT') return void this.emit('error', error);
        if (fileName !== name) return void this.#remove(filePath);
        // Events on targetPath itself are reported under its own basename,
        // so only a watched (directory) child can be told apart from it
        fs.stat(targetPath, (error) => {
          if (this.#watchers.get(targetPath) !== watcher) return;
          if (!error) {
            if (this.#watchers.has(filePath)) this.#remove(filePath);
            return;
          }
          if (error.code !== 'ENOENT') return void this.emit('error', error);
          this.#remove(targetPath);
        });
      });
    });
    watcher.on('error', (error) => {
      // Windows reports removal of a watched directory as EPERM
      if (error.code !== 'EPERM') return void this.emit('error', error);
      if (this.#watchers.get(targetPath) !== watcher) return;
      this.unwatch(targetPath);
      fs.stat(targetPath, (error, stats) => {
        if (this.#closed) return;
        if (!error) {
          // Directory was re-created, watch the new one
          if (stats.isDirectory()) this.watch(targetPath);
          return;
        }
        if (error.code !== 'ENOENT') return void this.emit('error', error);
        this.#post('delete', targetPath);
      });
    });
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

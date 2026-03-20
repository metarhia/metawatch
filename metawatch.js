'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const WATCH_TIMEOUT = 5000;

class DirectoryWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.watchers = new Map();
    this.pendingWatches = new Set();
    const { timeout = WATCH_TIMEOUT } = options;
    this.timeout = timeout;
    this.timer = null;
    this.queue = new Map();
  }

  close() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const watcher of this.watchers.values()) watcher.close();
    this.watchers.clear();
    this.pendingWatches.clear();
    this.queue.clear();
  }

  post(event, filePath) {
    if (this.timer) clearTimeout(this.timer);
    this.queue.set(filePath, event);
    if (this.timeout === 0) return void this.sendQueue();
    this.timer = setTimeout(() => {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.sendQueue();
    }, this.timeout);
  }

  sendQueue() {
    if (this.queue.size === 0) return;
    const queue = [...this.queue.entries()];
    this.queue.clear();
    this.emit('before', queue);
    for (const [filePath, event] of queue) {
      this.emit(event, filePath);
    }
    this.emit('after', queue);
  }

  watchDirectory(targetPath) {
    if (this.watchers.get(targetPath)) return;
    const watcher = fs.watch(targetPath, (event, fileName) => {
      const target = targetPath.endsWith(path.sep + fileName);
      const filePath = target ? targetPath : path.join(targetPath, fileName);
      fs.stat(filePath, (error, stats) => {
        if (error) {
          if (error.code === 'ENOENT') {
            this.unwatch(filePath);
            return void this.post('delete', filePath);
          }
          return void this.emit('error', error);
        }
        if (stats.isDirectory()) this.watch(filePath);
        if (filePath !== targetPath) this.post('change', filePath);
      });
    });
    watcher.on('error', (error) => this.emit('error', error));
    this.watchers.set(targetPath, watcher);
  }

  watch(targetPath) {
    const watcher = this.watchers.get(targetPath);
    if (watcher) return;
    if (this.pendingWatches.has(targetPath)) return;
    this.pendingWatches.add(targetPath);
    fs.readdir(targetPath, { withFileTypes: true }, (error, files) => {
      this.pendingWatches.delete(targetPath);
      if (error) return void this.emit('error', error);
      for (const file of files) {
        if (file.isDirectory()) {
          const dirPath = path.join(targetPath, file.name);
          this.watch(dirPath);
        }
      }
      this.watchDirectory(targetPath);
    });
  }

  unwatch(targetPath) {
    const watcher = this.watchers.get(targetPath);
    if (!watcher) return;
    watcher.close();
    this.watchers.delete(targetPath);
  }
}

module.exports = { DirectoryWatcher };

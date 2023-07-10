'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const WATCH_TIMEOUT = 5000;

class DirectoryWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.watchers = new Map();
    const { timeout = WATCH_TIMEOUT } = options;
    this.timeout = timeout;
    this.timer = null;
    this.queue = new Map();
  }

  post(event, filePath) {
    if (this.timer) clearTimeout(this.timer);
    this.queue.set(filePath, event);
    if (this.timeout === 0) {
      return void this.sendQueue();
    }
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
      fs.stat(filePath, (err, stats) => {
        if (err) {
          this.unwatch(filePath);
          return void this.post('delete', filePath);
        }
        if (stats.isDirectory()) this.watch(filePath);
        this.post('change', filePath);
      });
    });
    this.watchers.set(targetPath, watcher);
  }

  watch(targetPath) {
    const watcher = this.watchers.get(targetPath);
    if (watcher) return;
    fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
      if (err) return;
      for (const file of files) {
        if (file.isDirectory()) {
          const dirPath = path.join(targetPath, file.name);
          this.watch(dirPath);
        }
      }
      this.watchDirectory(targetPath);
    });
  }

  unwatch(path) {
    const watcher = this.watchers.get(path);
    if (!watcher) return;
    watcher.close();
    this.watchers.delete(path);
  }
}

module.exports = { DirectoryWatcher };

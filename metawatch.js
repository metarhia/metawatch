'use strict';

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const WATCH_TIMEOUT = 5000;

class DirectoryWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.watchers = new Map();
    this.timeout = options.timeout || WATCH_TIMEOUT;
    this.timer = null;
    this.queue = new Map();
  }

  post(event, filePath) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.sendQueue();
    }, this.timeout);
    this.queue.set(filePath, event);
  }

  sendQueue() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    for (const [filePath, event] of this.queue) {
      this.emit(event, filePath);
    }
    this.queue.clear();
  }

  watchDirectory(targetPath) {
    if (this.watchers.get(targetPath)) return;
    const watcher = fs.watch(targetPath, (event, fileName) => {
      const target = targetPath.endsWith(path.sep + fileName);
      const filePath = target ? targetPath : path.join(targetPath, fileName);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          this.unwatch(filePath);
          this.post('delete', filePath);
          return;
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

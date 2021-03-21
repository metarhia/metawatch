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
    this.queue = [];
    this.index = [];
  }

  post(event, fileName) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.sendQueue();
    }, this.timeout);
    const key = event + ':' + fileName;
    if (this.index.includes(key)) return;
    this.queue.push({ event, fileName });
    this.index.push(key);
  }

  sendQueue() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    for (const item of this.queue) {
      this.emit(item.event, item.fileName);
    }
    this.queue = [];
    this.index = [];
  }

  watchDirectory(targetPath) {
    if (this.watchers.get(targetPath)) return;
    const watcher = fs.watch(targetPath, (event, fileName) => {
      const filePath = path.join(targetPath, fileName);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (stats.isDirectory()) this.watch(filePath);
        this.post(event, filePath);
      });
    });
    this.watchers.set(targetPath, watcher);
  }

  watch(targetPath) {
    const watcher = this.watchers[targetPath];
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
    const watcher = this.watchers[path];
    if (!watcher) return;
    watcher.close();
    this.watchers.delete(path);
  }
}

module.exports = { DirectoryWatcher };

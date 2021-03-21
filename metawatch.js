'use strict';

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class DirectoryWatcher extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map();
  }

  watchDirectory(targetPath) {
    if (this.watchers.get(targetPath)) return;
    const watcher = fs.watch(targetPath, (event, fileName) => {
      const filePath = path.join(targetPath, fileName);
      try {
        fs.stat(filePath, (err, stats) => {
          if (stats.isDirectory()) this.watch(filePath);
        });
      } catch {
        return;
      }
      this.emit(event, fileName);
    });
    this.watchers.set(targetPath, watcher);
  }

  watch(targetPath) {
    const watcher = this.watchers[targetPath];
    if (watcher) return;
    fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
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

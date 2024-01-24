'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const WATCH_TIMEOUT = 5000;

const isExcludedFile = (excludeExts, excludeFiles) => (filePath) => {
  const { ext, base, name } = path.parse(filePath);
  const extIsExclude = excludeExts.has(ext.slice(1));
  if (extIsExclude) return true;
  return excludeFiles.has(name) || excludeFiles.has(base);
};

const isExcludedDir = (excludePaths) => (dirPath) => {
  const dirName = path.basename(dirPath);
  return excludePaths.has(dirName) || excludePaths.has(dirPath);
};

class DirectoryWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    const { dirs = [], files = [], exts = [] } = options.excludes || {};
    const { timeout = WATCH_TIMEOUT } = options;
    this.timeout = timeout;
    this.watchers = new Map();
    this.isExcludedFile = isExcludedFile(new Set(exts), new Set(files));
    this.isExcludedDir = isExcludedDir(new Set(dirs));
    this.timer = null;
    this.queue = new Map();
  }

  post(event, filePath) {
    if (this.timer) clearTimeout(this.timer);
    const events = this.queue.get(filePath);
    if (events) events.add(event);
    else this.queue.set(filePath, new Set(event));
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
    for (const [filePath, events] of queue) {
      for (const event of events) {
        this.emit(event, filePath);
      }
    }
    this.emit('after', queue);
  }

  watchDirectory(targetPath) {
    if (this.watchers.has(targetPath)) return;
    const watcher = fs.watch(targetPath);
    watcher.on('error', () => void this.unwatch(targetPath));
    watcher.on('change', (...args) => {
      const fileName = args.pop();
      const target = targetPath.endsWith(path.sep + fileName);
      const filePath = target ? targetPath : path.join(targetPath, fileName);
      if (this.isExcludedFile(filePath)) return;
      this.post('*', filePath);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          const keys = [...this.watchers.keys()];
          this.unwatch(filePath);
          this.post('delete', filePath);
          const event = keys.includes(filePath) ? 'rmdir' : 'rm';
          return void this.post(event, fileName);
        }
        if (stats.isDirectory()) this.watch(filePath);
        this.post('change', filePath);
      });
    });
    this.watchers.set(targetPath, watcher);
  }

  watch(targetPath) {
    if (this.isExcludedDir(targetPath)) return;
    fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
      if (err) return;
      for (const file of files) {
        if (!file.isDirectory()) continue;
        const dirPath = path.join(targetPath, file.name);
        this.watch(dirPath);
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

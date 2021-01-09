'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const fsReaddir = promisify(fs.readdir);
const fsStat = promisify(fs.stat);

const DEFAULT_DEBOUNCE = 10;

const getUniqueEvent = (fileName, event) => `${fileName}.${event}`;

const debounce = (listener, timeout) => {
  const events = new Set();
  return (event, fileName) => {
    const uniqueEventName = getUniqueEvent(fileName, event);
    if (events.has(uniqueEventName)) return;
    events.add(uniqueEventName);
    setTimeout(() => {
      listener(event, fileName);
      events.delete(uniqueEventName);
    }, timeout);
  };
};

class Watcher {
  constructor(config = {}) {
    this.debounce = config.debounce || DEFAULT_DEBOUNCE;

    this.watchers = new Map();
    this.isClosed = false;
  }

  async watch(targetPath, listener) {
    try {
      const wrappedListener = debounce(listener, this.debounce);
      const files = await fsReaddir(targetPath, { withFileTypes: true });
      if (this.isClosed) return;

      for (const file of files) {
        if (file.isDirectory()) {
          const dirPath = path.join(targetPath, file.name);
          this.watch(dirPath, listener);
        }
      }
      const watcher = fs.watch(targetPath, async (event, fileName) => {
        const filePath = path.join(targetPath, fileName);
        try {
          const stats = await fsStat(filePath);
          if (stats.isDirectory()) {
            this.watch(filePath, listener);
          }
        } catch (err) {
          if (err.code === 'ENOENT') {
            const { path } = err;
            this._close(path);
          }
        }
        wrappedListener(event, fileName);
      });
      this._add(targetPath, watcher);
    } catch (err) {
      console.error(err);
    }
  }

  closeAll() {
    this.isClosed = true;
    for (const targetPath of this.watchers.keys()) {
      this._close(targetPath);
    }
  }

  _close(targetPath) {
    const folderWatchers = this.watchers.get(targetPath);
    if (folderWatchers) {
      for (const watcher of folderWatchers) {
        watcher.close();
      }
      this.watchers.delete(targetPath);
    }
  }

  _add(targetPath, watcher) {
    const folderWatchers = this.watchers.get(targetPath);
    if (folderWatchers) {
      folderWatchers.add(watcher);
      return;
    }
    this.watchers.set(targetPath, new Set([watcher]));
  }
}

module.exports = Watcher;

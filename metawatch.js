'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_DEBOUNCE = 10;

class Watcher {
  constructor(config = {}) {
    this.debounce = config.debounce || DEFAULT_DEBOUNCE;

    this.watchers = [];
    this.isClosed = false;
  }

  watch(targetPath, listener) {
    const wrappedListener = this.debounceWrapper(listener, this.debounce);

    fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
      if (this.isClosed) return;

      for (const file of files) {
        if (file.isDirectory()) {
          const dirPath = path.join(targetPath, file.name);
          this.watch(dirPath, listener);
        }
      }
      const watcher = fs.watch(targetPath, (event, fileName) => {
        const filePath = path.join(targetPath, fileName);
        try {
          fs.stat(filePath, (err, stats) => {
            if (stats.isDirectory()) {
              this.watch(filePath, listener);
            }
          });
        } catch {
          return;
        }
        wrappedListener(event, fileName);
      });
      this.watchers.push(watcher);
    });
  }

  close() {
    this.isClosed = true;
    this.watchers.forEach(watcher => watcher.close());
  }

  getUniqueEvent(fileName, event) {
    return `${fileName}.${event}`;
  }

  debounceWrapper(listener, debounce) {
    const events = new Set();
    return (event, fileName) => {
      const uniqueEventName = this.getUniqueEvent(fileName, event);
      if (events.has(uniqueEventName)) return;
      events.add(uniqueEventName);
      setTimeout(() => {
        listener(event, fileName);
        events.delete(uniqueEventName);
      }, debounce);
    };
  }
}

module.exports = Watcher;

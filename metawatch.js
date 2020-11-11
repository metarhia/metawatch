'use strict';

const fs = require('fs');
const path = require('path');

const DebounceEmitter = require('./lib/debounceEmitter');

const getUniqueEvent = (targetPath, fileName, event) =>
  `${targetPath}.${fileName}.${event}`;

const watch = (targetPath, listener, timeout = 100) => {
  const ee = new DebounceEmitter(listener, timeout);
  fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
    for (const file of files) {
      if (file.isDirectory()) {
        const dirPath = path.join(targetPath, file.name);
        watch(dirPath, listener);
      }
    }
    fs.watch(targetPath, (event, fileName) => {
      const filePath = path.join(targetPath, fileName);
      try {
        fs.stat(filePath, (err, stats) => {
          if (stats.isDirectory()) watch(filePath, listener);
        });
      } catch {
        return;
      }
      ee.emit(getUniqueEvent(targetPath, fileName, event), event, fileName);
    });
  });
};

module.exports = watch;

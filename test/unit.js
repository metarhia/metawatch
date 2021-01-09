'use strict';

const fs = require('fs');
const path = require('path');

const Watcher = require('..');
const metatests = require('metatests');

const WATCH_TIMEOUT = 400;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const targetPath = path.join(dir, 'test/example');

metatests.test('Watch file change ', test => {
  test.strictSame(typeof Watcher, 'function');

  const timeout = setTimeout(() => {
    test.fail();
  }, TEST_TIMEOUT);

  let count = 0;
  const expected = 1;

  const watcher = new Watcher();
  watcher.watch(targetPath, (event, fileName) => {
    count++;
    test.strictSame(event, 'change');
    test.strictSame(fileName, 'file.ext');
    clearTimeout(timeout);
    if (count === expected) {
      test.end();
    }
  });

  setTimeout(() => {
    const filePath = path.join(targetPath, 'file.ext');
    fs.writeFile(filePath, 'example', 'utf8', err => {
      watcher.closeAll();
      test.error(err, 'Can not write file');
    });
  }, WATCH_TIMEOUT);
});

metatests.test('Skip duplicated events ', test => {
  const DEBOUNCE = 500;

  const expected = 1;
  let count = 0;

  const watcher = new Watcher({ debounce: DEBOUNCE });
  watcher.watch(targetPath, () => {
    count++;
  });

  const filePath = path.join(targetPath, 'file.ext');

  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      fs.writeFile(filePath, 'example', 'utf8', err => {
        watcher.closeAll();
        test.error(err, 'Can not write file');
      });
    }
  }, WATCH_TIMEOUT);

  setTimeout(() => {
    watcher.closeAll();
    test.strictSame(count, expected);
    test.end();
  }, TEST_TIMEOUT);
});

metatests.test('Close watcher', test => {
  const expected = 1;
  let count = 0;

  const mainWatcher = new Watcher();
  mainWatcher.watch(targetPath, () => {});

  setTimeout(() => {
    for (const watchersSet of mainWatcher.watchers.values()) {
      console.log(watchersSet);
      for (const watcher of watchersSet.values()) {
        // eslint-disable-next-line no-loop-func
        watcher.on('close', () => {
          count++;
        });
      }
    }
    mainWatcher.closeAll();
  }, WATCH_TIMEOUT);

  setTimeout(() => {
    test.strictSame(count, expected);
    test.strictSame(mainWatcher.isClosed, true);
    test.end();
  }, TEST_TIMEOUT);
});

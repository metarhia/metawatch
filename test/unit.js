'use strict';

const fs = require('node:fs');
const path = require('node:path');

const metawatch = require('..');
const metatests = require('metatests');

const OPTIONS = { timeout: 200 };
const WRITE_TIMEOUT = 100;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const cleanup = (dir) => {
  fs.rm(dir, { recursive: true, force: true }, (error) => {
    if (error) throw error;
  });
};

metatests.test('Single file change ', (test) => {
  const targetPath = path.join(dir, 'test/example1');
  fs.mkdirSync(targetPath);

  test.strictSame(typeof metawatch, 'object');

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  const timeout = setTimeout(() => {
    watcher.unwatch(targetPath);
    test.fail();
  }, TEST_TIMEOUT);

  watcher.on('change', (fileName) => {
    test.strictSame(fileName.endsWith('file.ext'), true);
    clearTimeout(timeout);
    watcher.unwatch(targetPath);
    cleanup(targetPath);
    watcher.removeAllListeners();
    test.end();
  });

  setTimeout(() => {
    const filePath = path.join(targetPath, 'file.ext');
    fs.writeFile(filePath, 'example', 'utf8', (err) => {
      test.error(err, 'Can not write file');
    });
  }, WRITE_TIMEOUT);
});

metatests.test('Aggregated change', (test) => {
  const targetPath = path.join(dir, 'test/example2');
  fs.mkdirSync(targetPath);

  const files = ['file1.ext', 'file2.ext', 'file3.ext'];

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  const timeout = setTimeout(() => {
    watcher.unwatch(targetPath);
    test.fail();
  }, TEST_TIMEOUT);

  let changeCount = 0;

  watcher.on('change', (fileName) => {
    test.strictSame(fileName.endsWith('.ext'), true);
    changeCount++;
  });

  watcher.on('before', (changes) => {
    test.strictSame(changes.length, 3);
  });

  watcher.on('after', (changes) => {
    test.strictSame(changeCount, 3);
    test.strictSame(changes.length, 3);
    clearTimeout(timeout);
    watcher.unwatch(targetPath);
    cleanup(targetPath);
    watcher.removeAllListeners();
    test.end();
  });

  setTimeout(() => {
    for (const name of files) {
      const filePath = path.join(targetPath, name);
      fs.writeFile(filePath, 'example', 'utf8', (err) => {
        test.error(err, 'Can not write file');
      });
    }
  }, WRITE_TIMEOUT);
});

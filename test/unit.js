'use strict';

const fs = require('node:fs');
const path = require('node:path');

const metawatch = require('..');
const metatests = require('metatests');

const OPTIONS = { timeout: 200 };
const WRITE_TIMEOUT = 100;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const targetPath = path.join(dir, 'test/example');

metatests.test('Single file change ', (test) => {
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
    test.end();
  });

  setTimeout(() => {
    const filePath = path.join(targetPath, 'file.ext');
    fs.writeFile(filePath, 'example', 'utf8', (err) => {
      test.error(err, 'Can not write file');
    });
  }, WRITE_TIMEOUT);
});

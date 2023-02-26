'use strict';

const fs = require('node:fs');
const path = require('node:path');

const metawatch = require('..');
const metatests = require('metatests');

const OPTIONS = { timeout: 200 };
const WRITE_TIMEOUT = 100;
const EXIT_TIMEOUT = 500;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const targetPath = path.join(dir, 'test/example');

metatests.test('Watch file change ', (test) => {
  test.strictSame(typeof metawatch, 'object');

  const timeout = setTimeout(() => {
    test.fail();
  }, TEST_TIMEOUT);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);
  watcher.on('change', (fileName) => {
    test.strictSame(fileName.endsWith('file.ext'), true);
    clearTimeout(timeout);
    test.end();
    setTimeout(() => {
      process.exit(0);
    }, EXIT_TIMEOUT);
  });

  setTimeout(() => {
    const filePath = path.join(targetPath, 'file.ext');
    fs.writeFile(filePath, 'example', 'utf8', (err) => {
      test.error(err, 'Can not write file');
    });
  }, WRITE_TIMEOUT);
});

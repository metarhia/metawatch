'use strict';

const fs = require('fs');
const path = require('path');

const metawatch = require('..');
const metatests = require('metatests');

const WATCH_TIMEOUT = 200;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const targetPath = path.join(dir, 'test/example');

metatests.test('Watch file change ', test => {
  test.strictSame(typeof metawatch, 'function');

  const timeout = setTimeout(() => {
    test.fail();
  }, TEST_TIMEOUT);

  let count = 0;
  const expected = process.platform === darwin ? 1 : 2;

  metawatch(targetPath, (event, fileName) => {
    count++;
    test.strictSame(event, 'change');
    test.strictSame(fileName, 'file.ext');
    clearTimeout(timeout);
    if (count === expected) {
      test.end();
      setTimeout(() => {
        process.exit(0);
      }, WATCH_TIMEOUT);
    }
  });

  setTimeout(() => {
    const filePath = path.join(targetPath, 'file.ext');
    fs.writeFile(filePath, 'example', 'utf8', err => {
      test.error(err, 'Can not write file');
    });
  }, WATCH_TIMEOUT);
});

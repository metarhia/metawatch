'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert');

const metawatch = require('..');

const OPTIONS = { timeout: 200 };
const WRITE_TIMEOUT = 100;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const cleanup = (dir) => {
  fs.rm(dir, { recursive: true, force: true }, (error) => {
    if (error) throw error;
  });
};

test('Single file change', async () => {
  const targetPath = path.join(dir, 'test/example1');
  fs.mkdirSync(targetPath);

  assert.strictEqual(typeof metawatch, 'object');

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.unwatch(targetPath);
      reject(new Error('Test timeout'));
    }, TEST_TIMEOUT);

    watcher.on('change', (fileName) => {
      assert.strictEqual(fileName.endsWith('file.ext'), true);
      clearTimeout(timeout);
      watcher.unwatch(targetPath);
      cleanup(targetPath);
      watcher.removeAllListeners();
      resolve();
    });

    setTimeout(() => {
      const filePath = path.join(targetPath, 'file.ext');
      fs.writeFile(filePath, 'example', 'utf8', (err) => {
        if (err) reject(err);
      });
    }, WRITE_TIMEOUT);
  });
});

test('Aggregated change', async () => {
  const targetPath = path.join(dir, 'test/example2');
  fs.mkdirSync(targetPath);

  const files = ['file1.ext', 'file2.ext', 'file3.ext'];

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.unwatch(targetPath);
      reject(new Error('Test timeout'));
    }, TEST_TIMEOUT);

    let changeCount = 0;

    watcher.on('change', (fileName) => {
      assert.strictEqual(fileName.endsWith('.ext'), true);
      changeCount++;
    });

    watcher.on('before', (changes) => {
      assert.strictEqual(changes.length, 3);
    });

    watcher.on('after', (changes) => {
      assert.strictEqual(changeCount, 3);
      assert.strictEqual(changes.length, 3);
      clearTimeout(timeout);
      watcher.unwatch(targetPath);
      cleanup(targetPath);
      watcher.removeAllListeners();
      resolve();
    });

    setTimeout(() => {
      for (const name of files) {
        const filePath = path.join(targetPath, name);
        fs.writeFile(filePath, 'example', 'utf8', (err) => {
          if (err) reject(err);
        });
      }
    }, WRITE_TIMEOUT);
  });
});

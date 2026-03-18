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

const cleanup = (pathToRemove) =>
  new Promise((resolve, reject) => {
    fs.rm(pathToRemove, { recursive: true, force: true }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

test('Single file change', async () => {
  const targetPath = path.join(dir, 'test/example1');
  fs.mkdirSync(targetPath);

  assert.strictEqual(typeof metawatch, 'object');

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.close();
      cleanup(targetPath)
        .then(() => reject(new Error('Test timeout')))
        .catch(reject);
    }, TEST_TIMEOUT);

    watcher.on('change', async (fileName) => {
      assert.strictEqual(fileName.endsWith('file.ext'), true);
      clearTimeout(timeout);
      watcher.close();
      try {
        await cleanup(targetPath);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    setTimeout(() => {
      const filePath = path.join(targetPath, 'file.ext');
      fs.writeFile(filePath, 'example', 'utf8', (err) => {
        if (err) {
          clearTimeout(timeout);
          watcher.close();
          cleanup(targetPath)
            .then(() => reject(err))
            .catch(reject);
        }
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
      watcher.close();
      cleanup(targetPath)
        .then(() => reject(new Error('Test timeout')))
        .catch(reject);
    }, TEST_TIMEOUT);

    let changeCount = 0;

    watcher.on('change', (fileName) => {
      assert.strictEqual(fileName.endsWith('.ext'), true);
      changeCount++;
    });

    watcher.on('before', (changes) => {
      assert.strictEqual(changes.length, 3);
    });

    watcher.on('after', async (changes) => {
      assert.strictEqual(changeCount, 3);
      assert.strictEqual(changes.length, 3);
      clearTimeout(timeout);
      watcher.close();
      try {
        await cleanup(targetPath);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    setTimeout(() => {
      for (const name of files) {
        const filePath = path.join(targetPath, name);
        fs.writeFile(filePath, 'example', 'utf8', (err) => {
          if (err) {
            clearTimeout(timeout);
            watcher.close();
            cleanup(targetPath)
              .then(() => reject(err))
              .catch(reject);
          }
        });
      }
    }, WRITE_TIMEOUT);
  });
});

test('File deletion detection', async () => {
  const targetPath = path.join(dir, 'test/example3');
  fs.mkdirSync(targetPath);
  const filePath = path.join(targetPath, 'delete-me.txt');

  fs.writeFileSync(filePath, 'content');

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.close();
      cleanup(targetPath)
        .then(() => reject(new Error('Test timeout')))
        .catch(reject);
    }, TEST_TIMEOUT);

    watcher.on('delete', async (fileName) => {
      assert.strictEqual(fileName, filePath);
      clearTimeout(timeout);
      watcher.close();
      try {
        await cleanup(targetPath);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    setTimeout(() => {
      fs.unlinkSync(filePath);
    }, WRITE_TIMEOUT);
  });
});

test('Nested directory watching', async () => {
  const targetPath = path.join(dir, 'test/example4');
  const nestedPath = path.join(targetPath, 'nested');
  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.close();
      cleanup(targetPath)
        .then(() => reject(new Error('Test timeout')))
        .catch(reject);
    }, TEST_TIMEOUT);

    watcher.on('change', async (fileName) => {
      if (fileName.endsWith('nested-file.txt')) {
        const expectedFile = path.join(nestedPath, 'nested-file.txt');
        assert.strictEqual(fileName, expectedFile);
        clearTimeout(timeout);
        watcher.close();
        try {
          await cleanup(targetPath);
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });

    setTimeout(() => {
      fs.mkdirSync(nestedPath);

      setTimeout(() => {
        const filePath = path.join(nestedPath, 'nested-file.txt');
        fs.writeFile(filePath, 'content', 'utf8', (err) => {
          if (err) {
            clearTimeout(timeout);
            watcher.close();
            cleanup(targetPath)
              .then(() => reject(err))
              .catch(reject);
          }
        });
      }, 50);
    }, WRITE_TIMEOUT);
  });
});

test('Constructor with default options', () => {
  const watcher = new metawatch.DirectoryWatcher();
  assert.strictEqual(watcher.timeout, 5000);
  assert.strictEqual(watcher.timer, null);
  assert.strictEqual(watcher.watchers.size, 0);
  assert.strictEqual(watcher.pendingWatches.size, 0);
  assert.strictEqual(watcher.queue.size, 0);
});

test('Constructor with custom timeout', () => {
  const customTimeout = 1000;
  const watcher = new metawatch.DirectoryWatcher({ timeout: customTimeout });
  assert.strictEqual(watcher.timeout, customTimeout);
});

test('Constructor with zero timeout', () => {
  const watcher = new metawatch.DirectoryWatcher({ timeout: 0 });
  assert.strictEqual(watcher.timeout, 0);
});

test('Unwatch non-existent directory', () => {
  const watcher = new metawatch.DirectoryWatcher();
  watcher.unwatch('/non/existent/path');
  assert.strictEqual(watcher.watchers.size, 0);
});

test('close() stops all watchers', async () => {
  const targetPath = path.join(dir, 'test/example7');
  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.ok(watcher.watchers.size > 0);
  watcher.close();
  assert.strictEqual(watcher.watchers.size, 0);
  assert.strictEqual(watcher.timer, null);
  await cleanup(targetPath);
});

test('Watch same directory twice', async () => {
  const targetPath = path.join(dir, 'test/example5');

  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }

  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);

  try {
    watcher.watch(targetPath);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const firstWatcher = watcher.watchers.get(targetPath);
    assert.ok(firstWatcher);

    watcher.watch(targetPath);
    const secondWatcher = watcher.watchers.get(targetPath);
    assert.strictEqual(firstWatcher, secondWatcher);
  } finally {
    watcher.close();
    await cleanup(targetPath);
  }
});

test('Immediate timeout (timeout: 0)', async () => {
  const targetPath = path.join(dir, 'test/example6');
  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher({ timeout: 0 });
  watcher.watch(targetPath);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.close();
      cleanup(targetPath)
        .then(() => reject(new Error('Test timeout')))
        .catch(reject);
    }, TEST_TIMEOUT);

    let eventCount = 0;

    watcher.on('change', async () => {
      eventCount++;
      if (eventCount === 2) {
        clearTimeout(timeout);
        watcher.close();
        try {
          await cleanup(targetPath);
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });

    setTimeout(() => {
      const file1 = path.join(targetPath, 'file1.txt');
      const file2 = path.join(targetPath, 'file2.txt');
      fs.writeFileSync(file1, 'content1');
      fs.writeFileSync(file2, 'content2');
    }, WRITE_TIMEOUT);
  });
});

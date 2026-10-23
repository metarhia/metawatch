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
  watcher.close();
});

test('Constructor with custom timeout', () => {
  const watcher = new metawatch.DirectoryWatcher({ timeout: 1000 });
  watcher.close();
});

test('Constructor with zero timeout', () => {
  const watcher = new metawatch.DirectoryWatcher({ timeout: 0 });
  watcher.close();
});

test('Unwatch non-existent directory', () => {
  const watcher = new metawatch.DirectoryWatcher();
  watcher.unwatch('/non/existent/path');
  watcher.close();
});

test('close() stops all watchers', async () => {
  const targetPath = path.join(dir, 'test/example7');
  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);
  await new Promise((resolve) => setTimeout(resolve, 50));

  let receivedAfterClose = false;
  watcher.on('change', () => {
    receivedAfterClose = true;
  });
  watcher.close();
  const filePath = path.join(targetPath, 'after-close.txt');
  fs.writeFileSync(filePath, 'content');
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(receivedAfterClose, false);
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
    watcher.watch(targetPath);

    await new Promise((resolve) => setTimeout(resolve, 50));

    let changeCount = 0;
    watcher.on('change', () => changeCount++);
    const filePath = path.join(targetPath, 'single-file.txt');
    fs.writeFileSync(filePath, 'content');
    await new Promise((resolve) => setTimeout(resolve, 250));
    assert.strictEqual(changeCount, 1);
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

test('Child with the same name as watched directory', async () => {
  const targetPath = path.join(dir, 'test/example8');
  fs.mkdirSync(targetPath);
  const filePath = path.join(targetPath, 'example8');

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(targetPath);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const changes = [];
    const deletes = [];
    watcher.on('change', (fileName) => changes.push(fileName));
    watcher.on('delete', (fileName) => deletes.push(fileName));
    fs.writeFileSync(filePath, 'content');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.deepStrictEqual(changes, [filePath]);
    fs.unlinkSync(filePath);
    fs.mkdirSync(filePath);
    await new Promise((resolve) => setTimeout(resolve, 300));
    fs.rmdirSync(filePath);
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.strictEqual(deletes.includes(filePath), true);
  } finally {
    watcher.close();
    await cleanup(targetPath);
  }
});

test('Unwatched directory deletion', async () => {
  const parentPath = path.join(dir, 'test/example9');
  const targetPath = path.join(parentPath, 'target');
  fs.mkdirSync(targetPath, { recursive: true });

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(parentPath);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const deletes = [];
    watcher.on('delete', (fileName) => deletes.push(fileName));
    watcher.unwatch(targetPath);
    fs.rmSync(targetPath, { recursive: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.deepStrictEqual(deletes, [targetPath]);
  } finally {
    watcher.close();
    await cleanup(parentPath);
  }
});

test('Unwatch before watch is ready', async () => {
  const targetPath = path.join(dir, 'test/example10');
  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(targetPath);
    watcher.unwatch(targetPath);
    await new Promise((resolve) => setTimeout(resolve, 50));

    let changeCount = 0;
    watcher.on('change', () => changeCount++);
    fs.writeFileSync(path.join(targetPath, 'file.txt'), 'content');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.strictEqual(changeCount, 0);
  } finally {
    watcher.close();
    await cleanup(targetPath);
  }
});

const skipWin32 =
  process.platform === 'win32' && 'Windows can not move a watched directory';

test('Moved directory stops nested watchers', { skip: skipWin32 }, async () => {
  const basePath = path.join(dir, 'test/example11');
  const targetPath = path.join(basePath, 'target');
  const subPath = path.join(targetPath, 'sub');
  const movedPath = path.join(basePath, 'moved');
  fs.mkdirSync(path.join(subPath, 'deep'), { recursive: true });

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(targetPath);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const changes = [];
    const deletes = [];
    watcher.on('change', (fileName) => changes.push(fileName));
    watcher.on('delete', (fileName) => deletes.push(fileName));
    fs.renameSync(subPath, movedPath);
    await new Promise((resolve) => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(movedPath, 'deep/file.txt'), 'content');
    await new Promise((resolve) => setTimeout(resolve, 300));
    const stalePath = path.join(subPath, 'deep/file.txt');
    assert.strictEqual(changes.includes(stalePath), false);
    assert.strictEqual(deletes.includes(stalePath), false);
    assert.strictEqual(deletes.includes(subPath), true);
  } finally {
    watcher.close();
    await cleanup(basePath);
  }
});

test('Re-created directory is watched again', async () => {
  const targetPath = path.join(dir, 'test/example12');
  const distPath = path.join(targetPath, 'dist');
  const filePath = path.join(distPath, 'file.txt');
  fs.mkdirSync(distPath, { recursive: true });

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(targetPath);
    await new Promise((resolve) => setTimeout(resolve, 100));

    fs.rmSync(distPath, { recursive: true });
    fs.mkdirSync(distPath);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const changes = [];
    watcher.on('change', (fileName) => changes.push(fileName));
    fs.writeFileSync(filePath, 'content');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.strictEqual(changes.includes(filePath), true);
  } finally {
    watcher.close();
    await cleanup(targetPath);
  }
});

test('Unwatch relative path with nested directories', async () => {
  const targetPath = path.join(dir, 'test/example13');
  const nestedPath = path.join(targetPath, 'nested');
  fs.mkdirSync(nestedPath, { recursive: true });
  const relativePath = path.relative(dir, targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(`.${path.sep}${relativePath}${path.sep}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    watcher.unwatch(relativePath);

    // macOS can deliver late events queued before unwatch(), skip them
    let changeCount = 0;
    watcher.on('change', (fileName) => {
      if (fileName.endsWith('file.txt')) changeCount++;
    });
    fs.writeFileSync(path.join(nestedPath, 'file.txt'), 'content');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.strictEqual(changeCount, 0);
  } finally {
    watcher.close();
    await cleanup(targetPath);
  }
});

test('Watch again right after unwatch', async () => {
  const targetPath = path.join(dir, 'test/example14');
  fs.mkdirSync(targetPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  try {
    watcher.watch(targetPath);
    watcher.unwatch(targetPath);
    watcher.watch(targetPath);
    await new Promise((resolve) => setTimeout(resolve, 50));

    let changeCount = 0;
    watcher.on('change', () => changeCount++);
    fs.writeFileSync(path.join(targetPath, 'file.txt'), 'content');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.strictEqual(changeCount, 1);
  } finally {
    watcher.close();
    await cleanup(targetPath);
  }
});

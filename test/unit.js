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

metatests.test('Single file change', (test) => {
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

metatests.test('Exclude extensions', (test) => {
  const targetPath = path.join(dir, 'test/example3');
  fs.mkdirSync(targetPath);

  const files = ['test.md', 'test.ts', 'test.ext'];

  const options = {
    excludes: {
      exts: ['md', 'ts'],
    },
    ...OPTIONS,
  };

  const watcher = new metawatch.DirectoryWatcher(options);
  watcher.watch(targetPath);

  const timeout = setTimeout(() => {
    watcher.unwatch(targetPath);
    test.fail();
  }, TEST_TIMEOUT);

  let changeCount = 0;

  watcher.on('change', (fileName) => {
    const { ext } = path.parse(fileName);
    test.strictSame(ext, '.ext');
    changeCount++;
  });

  watcher.on('after', (changes) => {
    test.strictEqual(changeCount, 1);
    test.strictEqual(changes.length, 1);
    clearTimeout(timeout);
    watcher.unwatch(targetPath);
    cleanup(targetPath);
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

metatests.test('Exclude files', (test) => {
  const targetPath = path.join(dir, 'test/example4');
  fs.mkdirSync(targetPath);

  const files = ['test1.ext', 'test2.ext', 'test3.ext'];

  const options = {
    excludes: {
      files: ['test2', 'test3'],
    },
    ...OPTIONS,
  };

  const watcher = new metawatch.DirectoryWatcher(options);
  watcher.watch(targetPath);

  const timeout = setTimeout(() => {
    watcher.unwatch(targetPath);
    test.fail();
  }, TEST_TIMEOUT);

  let changeCount = 0;

  watcher.on('change', (fileName) => {
    const { name } = path.parse(fileName);
    test.strictSame(name, 'test1');
    changeCount++;
  });

  watcher.on('after', (changes) => {
    test.strictEqual(changeCount, 1);
    test.strictEqual(changes.length, 1);
    clearTimeout(timeout);
    watcher.unwatch(targetPath);
    cleanup(targetPath);
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

metatests.test('Exclude dirs', (test) => {
  const targetPath = path.join(dir, 'test/example5');
  fs.mkdirSync(targetPath);

  const options = {
    excludes: {
      dirs: [targetPath],
    },
    ...OPTIONS,
  };

  const watcher = new metawatch.DirectoryWatcher(options);
  watcher.watch(targetPath);

  let changeEmitted = false;

  setTimeout(() => {
    cleanup(targetPath);
    test.strictEqual(changeEmitted, false);
    test.end();
  }, TEST_TIMEOUT);

  watcher.on('change', () => {
    changeEmitted = true;
  });

  setTimeout(() => {
    const filePath = path.join(targetPath, 'test.ext');
    fs.writeFile(filePath, 'example', 'utf8', (err) => {
      test.error(err, 'Can not write file');
    });
  }, WRITE_TIMEOUT);
});

metatests.test('Delete file (rm)', (test) => {
  const targetPath = path.join(dir, 'test/example6');
  fs.mkdirSync(targetPath);

  const filePath = path.join(targetPath, 'test.ext');
  const fd = fs.openSync(filePath, 'a');
  fs.closeSync(fd);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  const timeout = setTimeout(() => {
    watcher.unwatch(targetPath);
    test.fail();
  }, TEST_TIMEOUT);

  watcher.on('delete', (fileName) => {
    test.strictSame(fileName.endsWith('test.ext'), true);
  });

  watcher.on('rm', (fileName) => {
    test.strictSame(fileName.endsWith('test.ext'), true);
  });

  watcher.on('rmdir', () => {
    test.fail();
  });

  watcher.on('after', () => {
    clearTimeout(timeout);
    watcher.unwatch(targetPath);
    cleanup(targetPath);
    test.end();
  });

  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      test.error(err, 'Can not delete file');
    });
  }, WRITE_TIMEOUT);
});

metatests.test('Delete dir (rmdir)', (test) => {
  const targetPath = path.join(dir, 'test/example7');
  fs.mkdirSync(targetPath);

  const secondPath = path.join(targetPath, 'test');
  fs.mkdirSync(secondPath);

  const watcher = new metawatch.DirectoryWatcher(OPTIONS);
  watcher.watch(targetPath);

  const timeout = setTimeout(() => {
    watcher.unwatch(targetPath);
    test.fail();
  }, TEST_TIMEOUT);

  watcher.on('delete', (fileName) => {
    test.strictSame(fileName.endsWith('test'), true);
  });

  watcher.on('rmdir', (fileName) => {
    test.strictSame(fileName, 'example7/test');
  });

  watcher.on('rm', (fileName) => {
    test.strictSame(fileName, 'test');
  });

  watcher.on('after', () => {
    clearTimeout(timeout);
    watcher.unwatch(targetPath);
    cleanup(targetPath);
    test.end();
  });

  setTimeout(() => {
    fs.rmdir(secondPath, (err) => {
      test.error(err, 'Can not delete file');
    });
  }, WRITE_TIMEOUT);
});

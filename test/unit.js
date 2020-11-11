'use strict';

const fs = require('fs');
const path = require('path');

const metawatch = require('..');
const metatests = require('metatests');

const { DebounceEmitter } = require('../lib/debounceEmitter.js');

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
  const expected = 1;

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

metatests.test('Skip duplicated events ', test => {
  const DEBOUNCE_TIMEOUT = 100;
  const TEST_TIMEOUT = 300;

  const events = [
    { name: 'event-1', payload: 1 },
    { name: 'event-2', payload: 2 },
  ];
  const resolvedEvents = [];

  const ee = new DebounceEmitter(
    event => resolvedEvents.push(event),
    DEBOUNCE_TIMEOUT
  );

  const [event1, event2] = events;
  for (let i = 0; i < 100; i++) {
    ee.emit(event1.name, event1.payload);
    ee.emit(event2.name, event2.payload);
  }
  setTimeout(() => {
    ee.emit(event1.name, event1.payload);
  }, DEBOUNCE_TIMEOUT);
  ee.emit(event2.name, event2.payload);

  setTimeout(() => {
    test.strictSame(resolvedEvents, [1, 2, 1]);
    test.end();
  }, TEST_TIMEOUT);
});

'use strict';

const metawatch = require('..');
const metatests = require('metatests');

metatests.test('Test stub', async test => {
  test.strictSame(metawatch, {});
  test.end();
});

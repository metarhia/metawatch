# Deep nested directories watch for node.js

[![ci status](https://github.com/metarhia/metawatch/workflows/Testing%20CI/badge.svg)](https://github.com/metarhia/metawatch/actions?query=workflow%3A%22Testing+CI%22+branch%3Amaster)
[![snyk](https://snyk.io/test/github/metarhia/metawatch/badge.svg)](https://snyk.io/test/github/metarhia/metawatch)
[![npm version](https://badge.fury.io/js/metawatch.svg)](https://badge.fury.io/js/metawatch)
[![npm downloads/month](https://img.shields.io/npm/dm/metawatch.svg)](https://www.npmjs.com/package/metawatch)
[![npm downloads](https://img.shields.io/npm/dt/metawatch.svg)](https://www.npmjs.com/package/metawatch)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/metarhia/metawatch/blob/master/LICENSE)

- Watch directories recursive
- Rebuild recursive when new directories found or old directories remove
- Deduplicate events with debounce

## Usage

```js
const metawatch = require('metawatch');

const watcher = new metawatch.DirectoryWatcher({ timeout: 200 });
watcher.watch('/home/marcus/Downloads');
watcher.watch('/home/marcus/Documents');

watcher.on('change', (fileName) => {
  console.log({ changed: fileName });
});

watcher.on('delete', (fileName) => {
  console.log({ deleted: fileName });
});

watcher.on('before', (changes) => {
  console.log({ changes });
});

watcher.on('after', (changes) => {
  console.log({ changes });
});
```

## Contributors

- Timur Shemsedinov <timur.shemsedinov@gmail.com>
- See github for full [contributors list](https://github.com/metarhia/metawatch/graphs/contributors)

## License & Contributors

Copyright (c) 2020-2024 [Metarhia contributors](https://github.com/metarhia/metawatch/graphs/contributors).
Metawatch is [MIT licensed](./LICENSE).
Metawatch is a part of [Metarhia](https://github.com/metarhia) technology stack.

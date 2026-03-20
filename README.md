# Metawatch

[![ci status](https://github.com/metarhia/metawatch/workflows/Testing%20CI/badge.svg)](https://github.com/metarhia/metawatch/actions?query=workflow%3A%22Testing+CI%22+branch%3Amaster)
[![snyk](https://snyk.io/test/github/metarhia/metawatch/badge.svg)](https://snyk.io/test/github/metarhia/metawatch)
[![npm version](https://badge.fury.io/js/metawatch.svg)](https://badge.fury.io/js/metawatch)
[![npm downloads/month](https://img.shields.io/npm/dm/metawatch.svg)](https://www.npmjs.com/package/metawatch)
[![npm downloads](https://img.shields.io/npm/dt/metawatch.svg)](https://www.npmjs.com/package/metawatch)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/metarhia/metawatch/blob/master/LICENSE)

Recursive file and directory watcher for Node.js with debouncing, event deduplication, and zero dependencies.

## Features

- 🔍 **Recursive directory watching**: auto and recursive watches subdirectories
- 🔄 **Dynamic directory management**: auto adds new directories and removes deleted ones
- ⚡ **Event deduplication**: prevents duplicate events for the same file changes
- 🎯 **Debounced events**: batches multiple changes within a configurable timeout
- 📦 **Zero dependencies**, uses only Node.js built-in modules
- 🎭 **EventEmitter API**: simple event-driven interface

## Installation

Requires Node.js 18 or later.

```bash
npm i metawatch
```

## Quick Start

```js
const metawatch = require('metawatch');

const watcher = new metawatch.DirectoryWatcher({ timeout: 200 });
watcher.watch('/path/to/directory');

watcher.on('change', (fileName) => {
  console.log('File changed:', fileName);
});

watcher.on('delete', (fileName) => {
  console.log('File deleted:', fileName);
});
```

## API Reference

### DirectoryWatcher

```js
new DirectoryWatcher(options);
```

**Options:**

- `timeout` (number, optional): Debounce timeout in milliseconds. Default: `5000`

**Methods:**

- `watch(targetPath)` - Start watching directory recursively
- `unwatch(targetPath)` - Stop watching directory
- `close()` - Stop all watchers, clear timers and internal state

**Events:**

- `change` - File created/modified (`filePath`)
- `delete` - File deleted (`filePath`)
- `before` - Before processing batch (`changes` array of `[filePath, eventName]` tuples)
- `after` - After processing batch (`changes`)

## Examples

### Basic File Watching

```js
const metawatch = require('metawatch');

const watcher = new metawatch.DirectoryWatcher({ timeout: 500 });

watcher.watch('./src');

watcher.on('change', (fileName) => {
  console.log(`File changed: ${fileName}`);
  // Trigger rebuild, reload, etc.
});

watcher.on('delete', (fileName) => {
  console.log(`File deleted: ${fileName}`);
  // Clean up references, etc.
});
```

### File System Backup Monitor

```js
const metawatch = require('metawatch');
const fs = require('node:fs');

const watcher = new metawatch.DirectoryWatcher({ timeout: 1000 });
const backupQueue = new Set();

watcher.watch('/important/documents');

watcher.on('change', (fileName) => {
  console.log(`File modified: ${fileName}`);
  backupQueue.add(fileName);
});

watcher.on('delete', (fileName) => {
  console.log(`File deleted: ${fileName}`);
  // Remove from backup if it exists
  backupQueue.delete(fileName);
});

watcher.on('after', (changes) => {
  if (backupQueue.size > 0) {
    console.log(`Backing up ${backupQueue.size} files...`);
    // Process backup queue
    backupQueue.clear();
  }
});
```

### Multiple Directory Monitoring

```js
const fs = require('node:fs');
const path = require('node:path');
const metawatch = require('metawatch');

const watcher = new metawatch.DirectoryWatcher({ timeout: 200 });

const directories = ['./src', './tests', './docs', './config'];

directories.forEach((dir) => {
  if (fs.existsSync(dir)) {
    watcher.watch(path.resolve(dir));
    console.log(`Watching: ${dir}`);
  }
});

watcher.on('change', (fileName) => {
  const relativePath = path.relative(process.cwd(), fileName);
  console.log(`Changed: ${relativePath}`);
});

watcher.on('before', (changes) => {
  console.log(`Processing ${changes.length} changes...`);
});

watcher.on('after', (changes) => {
  console.log(`Completed processing ${changes.length} changes`);
});
```

### TypeScript Usage

```ts
import { DirectoryWatcher, DirectoryWatcherOptions } from 'metawatch';

const options: DirectoryWatcherOptions = {
  timeout: 500,
};

const watcher = new DirectoryWatcher(options);

watcher.watch('./src');

watcher.on('change', (fileName: string) => {
  console.log(`File changed: ${fileName}`);
});

watcher.on('delete', (fileName: string) => {
  console.log(`File deleted: ${fileName}`);
});
```

## Error Handling

```js
const watcher = new metawatch.DirectoryWatcher();

watcher.on('error', (error) => {
  console.error('Watcher error:', error);
});

try {
  watcher.watch('/restricted/path');
} catch (error) {
  console.error('Failed to watch directory:', error.message);
}
```

## Contributors

See [AUTHORS](./AUTHORS) and [contributors on GitHub](https://github.com/metarhia/metawatch/graphs/contributors).

## License & Contributors

Copyright (c) 2020-2026 [Metarhia contributors](https://github.com/metarhia/metawatch/graphs/contributors).
Metawatch is [MIT licensed](./LICENSE).
Metawatch is a part of [Metarhia](https://github.com/metarhia) technology stack.

import EventEmitter = require('events');

export class DirectoryWatcher extends EventEmitter {
  watchers: Map<string, FSWatcher>;
  timeout: number;
  timer: NodeJS.Timer;
  queue: Array<string>;
  index: Array<string>;
  constructor(options?: { timeout?: number });
  post(event: string, fileName: string): void;
  sendQueue(): void;
  watchDirectory(targetPath: string): void;
  watch(targetPath: string): void;
  unwatch(path: string): void;
}

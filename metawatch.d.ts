import { EventEmitter } from 'node:events';
import { FSWatcher } from 'node:fs';

export interface DirectoryWatcherOptions {
  timeout?: number;
}

export class DirectoryWatcher extends EventEmitter {
  watchers: Map<string, FSWatcher>;
  timeout: number;
  timer: NodeJS.Timeout;
  queue: Map<string, string>;

  constructor(options?: DirectoryWatcherOptions);
  post(event: string, filePath: string): void;
  sendQueue(): void;
  watchDirectory(targetPath: string): void;
  watch(targetPath: string): void;
  unwatch(path: string): void;
}

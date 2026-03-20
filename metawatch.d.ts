import { EventEmitter } from 'node:events';
import { FSWatcher } from 'node:fs';

export interface DirectoryWatcherOptions {
  timeout?: number;
}

export class DirectoryWatcher extends EventEmitter {
  watchers: Map<string, FSWatcher>;
  pendingWatches: Set<string>;
  timeout: number;
  timer: NodeJS.Timeout;
  queue: Map<string, string>;

  constructor(options?: DirectoryWatcherOptions);
  close(): void;
  post(eventName: string, filePath: string): void;
  sendQueue(): void;
  watchDirectory(targetPath: string): void;
  watch(targetPath: string): void;
  unwatch(targetPath: string): void;
}

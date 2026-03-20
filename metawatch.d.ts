import { EventEmitter } from 'node:events';

export type ChangeBatchEntry = [filePath: string, eventName: string];

export interface DirectoryWatcherEventMap {
  before: [changes: ChangeBatchEntry[]];
  after: [changes: ChangeBatchEntry[]];
  change: [filePath: string];
  delete: [filePath: string];
  error: [error: Error];
}

export interface DirectoryWatcherOptions {
  timeout?: number;
}

export class DirectoryWatcher extends EventEmitter<DirectoryWatcherEventMap> {
  constructor(options?: DirectoryWatcherOptions);
  close(): void;
  watch(targetPath: string): void;
  unwatch(targetPath: string): void;
}

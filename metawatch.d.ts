import { EventEmitter } from 'events';
import { FSWatcher } from 'fs';

export class DirectoryWatcher extends EventEmitter {
  watchers: Map<string, FSWatcher>;
  timeout: number;
  timer: NodeJS.Timer;
  queue: Map<string, string>;
  constructor(options?: { timeout?: number });
  post(event: string, fileName: string): void;
  sendQueue(): void;
  watchDirectory(targetPath: string): void;
  watch(targetPath: string): void;
  unwatch(path: string): void;
}

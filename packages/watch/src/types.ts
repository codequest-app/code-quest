export type { Unsubscribe, WatchCallback, WatchEvent, WatchService } from '@code-quest/schemas';

export interface MinimalLogger {
  debug(obj: object, msg: string): void;
  warn(msg: string): void;
  error(obj: object, msg: string): void;
}

import type { Unsubscribe, WatchCallback, WatchService } from './types.ts';

export class RemoteWatchService implements WatchService {
  // TODO: broadcaster-datasource change will implement this
  subscribe(_cwd: string, _cb: WatchCallback): Unsubscribe {
    throw new Error('RemoteWatchService: Not implemented');
  }
}

import type { TypedSocket } from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import type { Unsubscribe } from '@code-quest/summoner';
import type { DirtyBroadcaster } from '../services/dirty-broadcaster.ts';

export interface DirtyBroadcasters {
  fs: DirtyBroadcaster<string[]>;
  git: DirtyBroadcaster<void>;
  openspec: DirtyBroadcaster<void>;
}

/** Subscribe a socket to all three dirty broadcasters for a given cwd.
 *  Returns the unsub fns so the caller can manage lifetime in its own
 *  bookkeeping (cwd-keyed for `fs:watch`, channelId-keyed for ChannelManager). */
export function subscribeDirtyForSocket(
  socket: TypedSocket,
  cwd: string,
  dirty: DirtyBroadcasters,
): Unsubscribe[] {
  const offFs = dirty.fs.subscribe(cwd, socket.id, (paths) => {
    socket.emit(EVENTS.fs.dirty, { cwd, paths });
  });
  const offGit = dirty.git.subscribe(cwd, socket.id, () => {
    socket.emit(EVENTS.git.dirty, { cwd });
  });
  const offOps = dirty.openspec.subscribe(cwd, socket.id, () => {
    socket.emit(EVENTS.openspec.dirty, { cwd });
  });
  return [offFs, offGit, offOps];
}

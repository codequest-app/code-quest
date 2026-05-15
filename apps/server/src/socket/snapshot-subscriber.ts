import type { Broadcaster } from '@code-quest/broadcaster';
import type { TypedSocket } from '@code-quest/schemas';
import { EVENTS } from '@code-quest/schemas';

export function subscribeSnapshotForSocket(
  socket: TypedSocket,
  subscriberId: string,
  cwd: string,
  broadcaster: Broadcaster,
): () => void {
  return broadcaster.subscribe(cwd, subscriberId, (type, data) => {
    if (type === 'files') {
      socket.emit(EVENTS.fs.dirty, { cwd, paths: [], snapshot: data });
    } else if (type === 'git') {
      socket.emit(EVENTS.git.dirty, { cwd, snapshot: data });
    } else if (type === 'openspec') {
      socket.emit(EVENTS.openspec.dirty, { cwd, snapshot: data });
    }
  });
}

import type { Broadcaster } from '@code-quest/broadcaster';
import type {
  FileResult,
  GitStatusResult,
  OpenspecListResult,
  TypedSocket,
} from '@code-quest/schemas';
import { EVENTS } from '@code-quest/schemas';
import type { Unsubscribe } from '@code-quest/summoner';

export interface SnapshotBroadcasters {
  files: Broadcaster<FileResult[]>;
  git: Broadcaster<GitStatusResult>;
  openspec: Broadcaster<OpenspecListResult>;
}

export function subscribeSnapshotForSocket(
  socket: TypedSocket,
  subscriberId: string,
  cwd: string,
  broadcasters: SnapshotBroadcasters,
): Unsubscribe[] {
  const offFiles = broadcasters.files.subscribe(cwd, subscriberId, (snapshot) => {
    socket.emit(EVENTS.fs.dirty, { cwd, paths: [], snapshot });
  });
  const offGit = broadcasters.git.subscribe(cwd, subscriberId, (snapshot) => {
    socket.emit(EVENTS.git.dirty, { cwd, snapshot });
  });
  const offOpenspec = broadcasters.openspec.subscribe(cwd, subscriberId, (snapshot) => {
    socket.emit(EVENTS.openspec.dirty, { cwd, snapshot });
  });
  return [offFiles, offGit, offOpenspec];
}

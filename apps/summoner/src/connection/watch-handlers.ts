import {
  Broadcaster,
  CachedDataSource,
  FilesDataSource,
  GitDataSource,
  OpenspecDataSource,
} from '@code-quest/broadcaster';
import type {
  AgentTransport,
  FilesystemService,
  GitService,
  WatchService,
} from '@code-quest/schemas';
import { REMOTE_METHODS } from '@code-quest/schemas';
import type { OpenspecService } from '../openspec/types.ts';

interface WatchSnapshot {
  cwd: string;
  type: 'files' | 'git' | 'openspec';
  data: unknown;
}

export function registerWatchHandlers(
  rpc: AgentTransport,
  watchService: WatchService,
  fs: FilesystemService,
  git: GitService,
  openspec: OpenspecService,
): void {
  const filesBroadcaster = new Broadcaster(
    (cwd) => new CachedDataSource(new FilesDataSource(cwd, '', watchService, fs)),
  );
  const gitBroadcaster = new Broadcaster((cwd) => new GitDataSource(cwd, watchService, git));
  const openspecBroadcaster = new Broadcaster(
    (cwd) => new OpenspecDataSource(cwd, watchService, openspec),
  );

  const subscriptions = new Map<string, (() => void)[]>();

  function push(payload: WatchSnapshot): void {
    rpc.emit(REMOTE_METHODS.watch.snapshot, payload);
  }

  rpc.onRequest(REMOTE_METHODS.watch.start, async (params) => {
    const { cwd } = params as { cwd: string };

    // Replace any existing subscription for this cwd
    const existing = subscriptions.get(cwd);
    if (existing) {
      for (const off of existing) off();
    }

    const offs: (() => void)[] = [
      filesBroadcaster.subscribe(cwd, 'watch', (data) => push({ cwd, type: 'files', data })),
      gitBroadcaster.subscribe(cwd, 'watch', (data) => push({ cwd, type: 'git', data })),
      openspecBroadcaster.subscribe(cwd, 'watch', (data) => push({ cwd, type: 'openspec', data })),
    ];
    subscriptions.set(cwd, offs);
    return { ok: true };
  });

  rpc.onRequest(REMOTE_METHODS.watch.stop, async (params) => {
    const { cwd } = params as { cwd: string };
    const offs = subscriptions.get(cwd);
    if (offs) {
      for (const off of offs) off();
      subscriptions.delete(cwd);
    }
    return { ok: true };
  });
}

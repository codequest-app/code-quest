import {
  EVENTS,
  type FsDirectory,
  type FsFile,
  type FsMutationResult,
  filesDirtyEventSchema,
  fsBrowseResponseSchema,
  fsMutationResultSchema,
  TopicEmitter,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from 'react';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

export type FsBrowseEntries = { directories: FsDirectory[]; files: FsFile[] } | { error: string };

interface FsActions {
  browse: (path?: string) => Promise<FsBrowseEntries>;
  /** Subscribe to `files:dirty` events for `cwd`. The first subscriber per
   *  cwd emits `fs:watch` to the server (refcounted); the last release
   *  emits `fs:unwatch`. Returned unsubscribe is idempotent.
   *
   *  `onDirty` receives the cwd-relative paths from each batch; consumers
   *  who only care about "watcher alive so adjacent providers' dirty
   *  events keep flowing" can pass an empty callback. */
  subscribeFsDirty: (cwd: string, onDirty: (paths: string[]) => void) => () => void;
  // ── Mutations ──
  create: (path: string, kind: 'file' | 'directory') => Promise<FsMutationResult>;
  delete: (path: string) => Promise<FsMutationResult>;
  rename: (from: string, to: string) => Promise<FsMutationResult>;
  copy: (from: string, to: string) => Promise<FsMutationResult>;
  move: (from: string, to: string) => Promise<FsMutationResult>;
}

const FsActionsContext = createContext<FsActions | null>(null);

export function useFsActions(): FsActions {
  const ctx = useContext(FsActionsContext);
  if (!ctx) throw new Error('useFsActions must be used within FsProvider');
  return ctx;
}

export function FsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { socket } = useSocket();
  const emitterRef = useRef<TopicEmitter<string, string[]>>(new TopicEmitter());
  const refCounts = useRef<Map<string, number>>(new Map());
  // Stable subscriber id counter — each subscribe gets a unique id so
  // repeated subscribes from the same component don't collapse to one
  // entry in the TopicEmitter.
  const nextIdRef = useRef(0);

  // Central socket.on('files:dirty') → publish to TopicEmitter. One
  // handler installed for the lifetime of the Provider.
  useEffect(() => {
    if (!socket) return;
    const onDirty = (payload: unknown) => {
      const parsed = filesDirtyEventSchema.safeParse(payload);
      if (!parsed.success) return;
      emitterRef.current.publish(parsed.data.cwd, parsed.data.paths);
    };
    socket.on(EVENTS.fs.dirty, onDirty);
    return () => {
      socket.off(EVENTS.fs.dirty, onDirty);
    };
  }, [socket]);

  const actions = useMemo<FsActions>(
    () => ({
      async browse(path) {
        const payload = path ? { path } : {};
        const response = await rpc(socket, EVENTS.fs.browse, payload);
        const parsed = fsBrowseResponseSchema.safeParse(response);
        if (!parsed.success) return { directories: [], files: [] };
        if ('error' in parsed.data) return { error: parsed.data.error };
        return { directories: parsed.data.directories, files: parsed.data.files };
      },
      async create(path, kind) {
        const response = await rpc(socket, EVENTS.fs.create, { path, kind });
        const parsed = fsMutationResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      async delete(path) {
        const response = await rpc(socket, EVENTS.fs.delete, { path });
        const parsed = fsMutationResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      async rename(from, to) {
        const response = await rpc(socket, EVENTS.fs.rename, { from, to });
        const parsed = fsMutationResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      async copy(from, to) {
        const response = await rpc(socket, EVENTS.fs.copy, { from, to });
        const parsed = fsMutationResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      async move(from, to) {
        const response = await rpc(socket, EVENTS.fs.move, { from, to });
        const parsed = fsMutationResultSchema.safeParse(response);
        return parsed.success ? parsed.data : { error: 'Invalid response' };
      },
      subscribeFsDirty(cwd, onDirty) {
        const id = `sub-${nextIdRef.current++}`;
        const off = emitterRef.current.subscribe(cwd, id, onDirty);
        const prev = refCounts.current.get(cwd) ?? 0;
        refCounts.current.set(cwd, prev + 1);
        if (prev === 0) socket.emit(EVENTS.fs.watch, { cwd });
        let active = true;
        return () => {
          if (!active) return;
          active = false;
          off();
          const c = refCounts.current.get(cwd) ?? 0;
          if (c <= 0) return;
          if (c === 1) {
            refCounts.current.delete(cwd);
            socket.emit(EVENTS.fs.unwatch, { cwd });
          } else {
            refCounts.current.set(cwd, c - 1);
          }
        };
      },
    }),
    [socket],
  );

  return <FsActionsContext.Provider value={actions}>{children}</FsActionsContext.Provider>;
}

export function useFsBrowse(): {
  browse: (path?: string) => Promise<FsDirectory[]>;
  browseEntries: (path?: string) => Promise<FsBrowseEntries>;
} {
  const { browse: browseEntries } = useFsActions();

  async function browse(path?: string): Promise<FsDirectory[]> {
    const result = await browseEntries(path);
    if ('error' in result) return [];
    return result.directories;
  }

  return { browse: browse, browseEntries: browseEntries };
}

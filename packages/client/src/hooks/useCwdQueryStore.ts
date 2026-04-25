import { TopicEmitter } from '@code-quest/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

export interface CwdQueryStore<R> {
  get: (cwd: string) => R | undefined;
  subscribe: (cwd: string, onChange: () => void) => () => void;
  refetch: (cwd: string) => Promise<void>;
  /** Refetch only if at least one subscriber currently watches `cwd`.
   *  Use for events (e.g. branch changed) that may target paths nobody
   *  reads — an unconditional refetch would populate the cache forever. */
  refetchIfSubscribed: (cwd: string) => Promise<void>;
}

export interface CwdQueryStoreConfig<R> {
  socket: Socket | null;
  fetch: (cwd: string) => Promise<R>;
  dirtyEvent: string;
  extractCwd: (payload: unknown) => string | null;
  idPrefix: string;
}

/** Generic per-cwd query store: cache + inflight dedup + dirty-event-driven
 *  refetch. Three contexts (Git status, Openspec list, …) ran the same
 *  ~80-line scaffold; this hook is the single implementation. */
export function useCwdQueryStore<R>({
  socket,
  fetch,
  dirtyEvent,
  extractCwd,
  idPrefix,
}: CwdQueryStoreConfig<R>): CwdQueryStore<R> {
  // useState initializer guarantees one-time allocation. `useRef(new …())`
  // would allocate per render and discard all but the first.
  const [emitter] = useState(() => new TopicEmitter<string, void>());
  const [cache] = useState<Map<string, R>>(() => new Map());
  const [inflight] = useState<Map<string, Promise<void>>>(() => new Map());
  const nextSubIdRef = useRef(0);

  const refetch = useCallback(
    async (cwd: string): Promise<void> => {
      const next = await fetch(cwd);
      cache.set(cwd, next);
      emitter.publish(cwd, undefined);
    },
    [fetch, cache, emitter],
  );

  const ensureFetched = useCallback(
    (cwd: string): Promise<void> => {
      if (cache.has(cwd)) return Promise.resolve();
      const existing = inflight.get(cwd);
      if (existing) return existing;
      const p = refetch(cwd).finally(() => inflight.delete(cwd));
      inflight.set(cwd, p);
      return p;
    },
    [refetch, cache, inflight],
  );

  useEffect(() => {
    if (!socket) return;
    const onDirty = (payload: unknown) => {
      const cwd = extractCwd(payload);
      if (!cwd) return;
      if (emitter.hasSubscribers(cwd)) {
        void refetch(cwd);
      }
    };
    socket.on(dirtyEvent, onDirty);
    return () => {
      socket.off(dirtyEvent, onDirty);
    };
  }, [socket, dirtyEvent, extractCwd, refetch, emitter]);

  const get = useCallback((cwd: string) => cache.get(cwd), [cache]);

  const subscribe = useCallback(
    (cwd: string, onChange: () => void) => {
      const id = `${idPrefix}-${nextSubIdRef.current++}`;
      const off = emitter.subscribe(cwd, id, onChange);
      if (!cache.has(cwd)) {
        void ensureFetched(cwd);
      }
      return off;
    },
    [idPrefix, ensureFetched, emitter, cache],
  );

  const refetchIfSubscribed = useCallback(
    async (cwd: string): Promise<void> => {
      if (!emitter.hasSubscribers(cwd)) return;
      await refetch(cwd);
    },
    [emitter, refetch],
  );

  return { get, subscribe, refetch, refetchIfSubscribed };
}

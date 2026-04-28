import { getOrSet, TopicEmitter } from '@code-quest/shared';

export interface QueryStoreConfig<R> {
  fetch: (key: string) => Promise<R>;
  idPrefix: string;
}

export interface QueryStore<R> {
  get: (key: string) => R | undefined;
  subscribe: (key: string, onChange: () => void) => () => void;
  refetch: (key: string) => Promise<void>;
  refetchIfSubscribed: (key: string) => Promise<void>;
  hasSubscribers: (key: string) => boolean;
}

async function refetchInto<R>(
  fetchFn: (key: string) => Promise<R>,
  cache: Map<string, R>,
  emitter: TopicEmitter<string, void>,
  key: string,
): Promise<void> {
  cache.set(key, await fetchFn(key));
  emitter.publish(key, undefined);
}

function ensureFetched<R>(
  inflight: Map<string, Promise<void>>,
  cache: Map<string, R>,
  doRefetch: (key: string) => Promise<void>,
  key: string,
): Promise<void> {
  if (cache.has(key)) return Promise.resolve();
  return getOrSet(inflight, key, () => doRefetch(key));
}

export function createQueryStore<R>({
  fetch: fetchFn,
  idPrefix,
}: QueryStoreConfig<R>): QueryStore<R> {
  const emitter = new TopicEmitter<string, void>();
  const cache = new Map<string, R>();
  const inflight = new Map<string, Promise<void>>();
  let nextSubId = 0;

  const refetch = (key: string) => refetchInto(fetchFn, cache, emitter, key);

  return {
    get: (key) => cache.get(key),
    subscribe: (key, onChange) => {
      const off = emitter.subscribe(key, `${idPrefix}-${nextSubId++}`, onChange);
      void ensureFetched(inflight, cache, refetch, key);
      return off;
    },
    refetch,
    refetchIfSubscribed: async (key) => {
      if (emitter.hasSubscribers(key)) await refetch(key);
    },
    hasSubscribers: (key) => emitter.hasSubscribers(key),
  };
}

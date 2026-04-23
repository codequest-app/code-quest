import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

type StringStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const map = new Map<string, string>();

export const memoryBackend: StringStorage & { clear(): void } = {
  getItem: (k) => map.get(k) ?? null,
  setItem: (k, v) => {
    map.set(k, v);
  },
  removeItem: (k) => {
    map.delete(k);
  },
  clear: () => {
    map.clear();
  },
};

/** Zustand persist storage adapter backed by an in-memory Map. */
export function memoryPersist<S>(): PersistStorage<S> | undefined {
  return createJSONStorage<S>(() => memoryBackend);
}

/** Read the raw JSON string that a persist store wrote under `name`. */
export function readPersistedRaw(name: string): string | null {
  return memoryBackend.getItem(name);
}

import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

/**
 * Default persist backend for zustand stores: real `window.localStorage`.
 *
 * Tests inject an in-memory replacement via zustand's
 * `store.persist.setOptions({ storage: ... })` from the test setup — this
 * module knows nothing about tests.
 */
export function localStoragePersist<S>(): PersistStorage<S> | undefined {
  return createJSONStorage<S>(() => window.localStorage);
}

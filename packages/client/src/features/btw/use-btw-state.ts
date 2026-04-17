import { useSyncExternalStore } from 'react';
import { type BtwState, btwSignal } from './btw-feature';

export function useBtwState(): BtwState {
  return useSyncExternalStore(
    (cb) => btwSignal.subscribe(cb),
    () => btwSignal.getState(),
  );
}

import type { Feature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const rewindOpenSignal = createOpenSignal();

export function createRewindFeature(): Feature {
  return {
    id: 'rewind',
    label: 'Rewind',
    section: 'Context',
    order: 1,
    execute() {
      rewindOpenSignal.setOpen(true);
    },
  };
}

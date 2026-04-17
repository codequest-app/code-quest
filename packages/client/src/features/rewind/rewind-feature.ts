import type { MenuItemFeature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const rewindOpenSignal = createOpenSignal();

export function createRewindFeature(): MenuItemFeature {
  return {
    id: 'rewind',
    menuItem: { label: 'Rewind', section: 'Context', order: 1 },
    execute() {
      rewindOpenSignal.setOpen(true);
    },
  };
}

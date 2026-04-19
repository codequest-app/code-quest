import type { Feature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const switchAccountSignal = createOpenSignal();

export function createSwitchAccountFeature(): Feature {
  return {
    id: 'switch-account',
    label: 'Switch account',
    section: 'Settings',
    ui: { closeSilent: true },
    execute() {
      switchAccountSignal.setOpen(true);
    },
  };
}

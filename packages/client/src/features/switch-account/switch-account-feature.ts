import type { Feature } from '../../lib/feature';
import { switchAccountSignal } from './switch-account-signal';

export function createSwitchAccountFeature(): Feature {
  return {
    id: 'switch-account',
    label: 'Switch account',
    category: 'Settings',
    ui: { closeSilent: true },
    execute() {
      switchAccountSignal.setOpen(true);
    },
  };
}

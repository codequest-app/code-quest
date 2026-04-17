import type { MenuItemFeature } from '../../lib/feature';
import { switchAccountSignal } from './switch-account-signal';

export function createSwitchAccountFeature(): MenuItemFeature {
  return {
    id: 'switch-account',
    menuItem: { label: 'Switch account', section: 'Settings', closeSilent: true },
    execute() {
      switchAccountSignal.setOpen(true);
    },
  };
}

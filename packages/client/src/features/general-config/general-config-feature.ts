import type { MenuItemFeature } from '../../lib/feature';
import { generalConfigSignal } from './general-config-signal';

export function createGeneralConfigFeature(): MenuItemFeature {
  return {
    id: 'general-config',
    menuItem: { label: 'General config…', section: 'Settings', closeSilent: true },
    execute() {
      generalConfigSignal.setOpen(true);
    },
  };
}

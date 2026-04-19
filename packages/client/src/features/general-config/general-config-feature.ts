import type { Feature } from '../../lib/feature';
import { generalConfigSignal } from './general-config-signal';

export function createGeneralConfigFeature(): Feature {
  return {
    id: 'general-config',
    label: 'General config…',
    section: 'Settings',
    ui: { closeSilent: true },
    execute() {
      generalConfigSignal.setOpen(true);
    },
  };
}

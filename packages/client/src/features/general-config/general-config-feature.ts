import type { Feature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const generalConfigSignal = createOpenSignal();

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

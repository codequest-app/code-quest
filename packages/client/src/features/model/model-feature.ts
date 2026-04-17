import type { MenuItemFeature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const modelOpenSignal = createOpenSignal();

export function createModelFeature(): MenuItemFeature {
  return {
    id: 'model',
    menuItem: { label: 'Switch model', section: 'Model', order: 0 },
    execute() {
      modelOpenSignal.setOpen(true);
    },
  };
}

import type { MenuItemFeature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const modelOpenSignal = createOpenSignal();

interface ModelFeatureDeps {
  modelLabel: string;
}

export function createModelFeature({ modelLabel }: ModelFeatureDeps): MenuItemFeature {
  return {
    id: 'model',
    menuItem: {
      label: 'Switch model',
      section: 'Model',
      order: 0,
      closeSilent: true,
      trailing: <span className="font-mono text-[11px] text-text-muted">{modelLabel}</span>,
    },
    execute() {
      modelOpenSignal.setOpen(true);
    },
  };
}

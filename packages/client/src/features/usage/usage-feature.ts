import type { MenuItemFeature, SlashCommandFeature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const usageOpenSignal = createOpenSignal();

interface UsageFeatureDeps {
  emitRefreshUsage: () => void;
}

type UsageFeature = SlashCommandFeature & MenuItemFeature;

export function createUsageFeature({ emitRefreshUsage }: UsageFeatureDeps): UsageFeature {
  return {
    id: 'usage',
    command: '/usage',
    menuItem: { label: 'Account & usage…', section: 'Model', order: 40, closeSilent: true },
    invoke() {
      this.execute();
    },
    execute() {
      emitRefreshUsage();
      usageOpenSignal.setOpen(true);
    },
  };
}

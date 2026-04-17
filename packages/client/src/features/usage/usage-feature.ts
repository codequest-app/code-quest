import type { MenuItemFeature, SlashCommandFeature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const usageOpenSignal = createOpenSignal();

export interface UsageFeatureDeps {
  emitRefreshUsage: () => void;
}

export type UsageFeature = SlashCommandFeature & MenuItemFeature;

export function createUsageFeature({ emitRefreshUsage }: UsageFeatureDeps): UsageFeature {
  return {
    id: 'usage',
    command: '/usage',
    menuItem: { label: 'Account & usage…', section: 'Model' },
    invoke() {
      this.execute();
    },
    execute() {
      emitRefreshUsage();
      usageOpenSignal.setOpen(true);
    },
  };
}

import type { Feature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const usageOpenSignal = createOpenSignal();

interface UsageFeatureDeps {
  emitRefreshUsage: () => void;
}

export function createUsageFeature({ emitRefreshUsage }: UsageFeatureDeps): Feature {
  function run() {
    emitRefreshUsage();
    usageOpenSignal.setOpen(true);
  }
  return {
    id: 'usage',
    label: 'Account & usage…',
    section: 'Model',
    order: 40,
    ui: { closeSilent: true },
    execute: run,
    slash: {
      command: '/usage',
      invoke() {
        run();
      },
    },
  };
}

import type { MenuItemFeature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const resumeOpenSignal = createOpenSignal();

export function createResumeFeature(): MenuItemFeature {
  return {
    id: 'resume',
    menuItem: { label: 'Resume conversation…', section: 'Context', order: 10 },
    execute() {
      resumeOpenSignal.setOpen(true);
    },
  };
}

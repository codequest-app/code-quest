import type { Feature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const resumeOpenSignal = createOpenSignal();

export function createResumeFeature(): Feature {
  return {
    id: 'resume',
    label: 'Resume conversation…',
    category: 'Context',
    order: 10,
    execute() {
      resumeOpenSignal.setOpen(true);
    },
  };
}

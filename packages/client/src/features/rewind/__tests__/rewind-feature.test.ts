import { describe, expect, it } from 'vitest';
import { createRewindFeature, rewindOpenSignal } from '../rewind-feature.ts';

describe('createRewindFeature', () => {
  it('has id rewind with label in Context section', () => {
    const feature = createRewindFeature();
    expect(feature.id).toBe('rewind');
    expect(feature.label).toBe('Rewind');
    expect(feature.section).toBe('Context');
    expect(feature.order).toBe(1);
  });

  it('execute opens the rewind dialog via signal', () => {
    rewindOpenSignal.setOpen(false);
    createRewindFeature().execute();
    expect(rewindOpenSignal.isOpen).toBe(true);
    rewindOpenSignal.setOpen(false);
  });
});

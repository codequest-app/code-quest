import { describe, expect, it } from 'vitest';
import { createRewindFeature, rewindOpenSignal } from '../rewind-feature';

describe('createRewindFeature', () => {
  it('has id rewind with label in Context category', () => {
    const feature = createRewindFeature();
    expect(feature.id).toBe('rewind');
    expect(feature.label).toBe('Rewind');
    expect(feature.category).toBe('Context');
    expect(feature.order).toBe(1);
  });

  it('execute opens the rewind dialog via signal', () => {
    rewindOpenSignal.setOpen(false);
    createRewindFeature().execute();
    expect(rewindOpenSignal.isOpen).toBe(true);
    rewindOpenSignal.setOpen(false);
  });
});

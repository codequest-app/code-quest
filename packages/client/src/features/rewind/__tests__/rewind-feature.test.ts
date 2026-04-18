import { describe, expect, it } from 'vitest';
import { createRewindFeature, rewindOpenSignal } from '../rewind-feature';

describe('createRewindFeature', () => {
  it('has id rewind with label in Context section', () => {
    const feature = createRewindFeature();
    expect(feature.id).toBe('rewind');
    expect(feature.menuItem.label).toBe('Rewind');
    expect(feature.menuItem.section).toBe('Context');
    expect(feature.menuItem.order).toBe(1);
  });

  it('execute opens the rewind dialog via signal', () => {
    // ensure closed first
    rewindOpenSignal.setOpen(false);
    createRewindFeature().execute();
    expect(rewindOpenSignal.isOpen).toBe(true);
    rewindOpenSignal.setOpen(false);
  });
});

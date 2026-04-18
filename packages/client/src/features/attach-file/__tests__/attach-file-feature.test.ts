import { describe, expect, it, vi } from 'vitest';
import { createAttachFileFeature } from '../attach-file-feature';

describe('createAttachFileFeature', () => {
  it('has id attach-file', () => {
    expect(createAttachFileFeature({}).id).toBe('attach-file');
  });

  it('is in Context category with label Attach file…', () => {
    const feature = createAttachFileFeature({});
    expect(feature.label).toBe('Attach file…');
    expect(feature.category).toBe('Context');
    expect(feature.ui?.closeSilent).toBe(true);
  });

  it('execute calls onAttachFile', () => {
    const onAttachFile = vi.fn();
    createAttachFileFeature({ onAttachFile }).execute();
    expect(onAttachFile).toHaveBeenCalledOnce();
  });

  it('execute does nothing when onAttachFile is not provided', () => {
    expect(() => createAttachFileFeature({}).execute()).not.toThrow();
  });
});

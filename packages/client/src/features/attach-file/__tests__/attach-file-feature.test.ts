import { describe, expect, it, vi } from 'vitest';
import { createAttachFileFeature } from '../attach-file-feature';

describe('createAttachFileFeature', () => {
  it('has id attach-file', () => {
    expect(createAttachFileFeature({}).id).toBe('attach-file');
  });

  it('menuItem is in Context section with label Attach file…', () => {
    const { menuItem } = createAttachFileFeature({});
    expect(menuItem.label).toBe('Attach file…');
    expect(menuItem.section).toBe('Context');
    expect(menuItem.closeSilent).toBe(true);
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

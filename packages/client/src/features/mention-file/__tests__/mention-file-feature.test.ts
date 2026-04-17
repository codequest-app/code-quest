import { describe, expect, it, vi } from 'vitest';
import { createMentionFileFeature } from '../mention-file-feature';

describe('createMentionFileFeature', () => {
  it('has id mention-file', () => {
    expect(createMentionFileFeature({ mentionFile: vi.fn() }).id).toBe('mention-file');
  });

  it('menuItem is in Context section with label Mention file from this project...', () => {
    const { menuItem } = createMentionFileFeature({ mentionFile: vi.fn() });
    expect(menuItem.label).toBe('Mention file from this project...');
    expect(menuItem.section).toBe('Context');
  });

  it('execute calls mentionFile', () => {
    const mentionFile = vi.fn();
    createMentionFileFeature({ mentionFile }).execute();
    expect(mentionFile).toHaveBeenCalledOnce();
  });
});

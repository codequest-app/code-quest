import { describe, expect, it, vi } from 'vitest';
import { createClearFeature } from '../clear-feature';

function makeDeps() {
  return {
    clearMessages: vi.fn(),
    clearModifiedFiles: vi.fn(),
    sendMessage: vi.fn(),
  };
}

describe('createClearFeature', () => {
  it('has id clear', () => {
    expect(createClearFeature(makeDeps()).id).toBe('clear');
  });

  it('menuItem is in Context section with label Clear conversation', () => {
    const { menuItem } = createClearFeature(makeDeps());
    expect(menuItem.label).toBe('Clear conversation');
    expect(menuItem.section).toBe('Context');
  });

  it('execute calls clearMessages, clearModifiedFiles, and sends /clear to CLI', () => {
    const deps = makeDeps();
    createClearFeature(deps).execute();
    expect(deps.clearMessages).toHaveBeenCalledOnce();
    expect(deps.clearModifiedFiles).toHaveBeenCalledOnce();
    expect(deps.sendMessage).toHaveBeenCalledWith('/clear');
  });
});

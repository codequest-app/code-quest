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

  it('is in Context category with label Clear conversation', () => {
    const feature = createClearFeature(makeDeps());
    expect(feature.label).toBe('Clear conversation');
    expect(feature.category).toBe('Context');
    expect(feature.order).toBe(0);
  });

  it('execute calls clearMessages, clearModifiedFiles, and sends /clear to CLI', () => {
    const deps = makeDeps();
    createClearFeature(deps).execute();
    expect(deps.clearMessages).toHaveBeenCalledOnce();
    expect(deps.clearModifiedFiles).toHaveBeenCalledOnce();
    expect(deps.sendMessage).toHaveBeenCalledWith('/clear');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createClearFeature } from '../clear-feature.ts';

function makeCtx() {
  return {
    clearMessages: vi.fn(),
    clearModifiedFiles: vi.fn(),
    sendMessage: vi.fn(),
  };
}

describe('createClearFeature', () => {
  it('has id clear', () => {
    expect(createClearFeature(makeCtx()).id).toBe('clear');
  });

  it('is in Context section with label Clear conversation', () => {
    const feature = createClearFeature(makeCtx());
    expect(feature.label).toBe('Clear conversation');
    expect(feature.section).toBe('Context');
    expect(feature.order).toBe(0);
  });

  it('execute calls clearMessages, clearModifiedFiles, and sends /clear to CLI', () => {
    const ctx = makeCtx();
    createClearFeature(ctx).execute();
    expect(ctx.clearMessages).toHaveBeenCalledOnce();
    expect(ctx.clearModifiedFiles).toHaveBeenCalledOnce();
    expect(ctx.sendMessage).toHaveBeenCalledWith('/clear');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createThinkingFeature } from '../thinking-feature.ts';

describe('createThinkingFeature', () => {
  it('returns a Feature with id toggle-thinking and section Model', () => {
    const feature = createThinkingFeature({
      isThinkingOn: false,
      onSetThinkingLevel: vi.fn(),
    });
    expect(feature.id).toBe('toggle-thinking');
    expect(feature.section).toBe('Model');
    expect(feature.label).toBe('Thinking');
  });

  it('state reflects isThinkingOn: false → active false', () => {
    const feature = createThinkingFeature({ isThinkingOn: false, onSetThinkingLevel: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: false });
  });

  it('state reflects isThinkingOn: true → active true', () => {
    const feature = createThinkingFeature({ isThinkingOn: true, onSetThinkingLevel: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: true });
  });

  it('execute calls onSetThinkingLevel with default_on when thinking is off', () => {
    const onSetThinkingLevel = vi.fn();
    const feature = createThinkingFeature({ isThinkingOn: false, onSetThinkingLevel });
    feature.execute();
    expect(onSetThinkingLevel).toHaveBeenCalledWith('default_on');
  });

  it('execute calls onSetThinkingLevel with off when thinking is on', () => {
    const onSetThinkingLevel = vi.fn();
    const feature = createThinkingFeature({ isThinkingOn: true, onSetThinkingLevel });
    feature.execute();
    expect(onSetThinkingLevel).toHaveBeenCalledWith('off');
  });
});

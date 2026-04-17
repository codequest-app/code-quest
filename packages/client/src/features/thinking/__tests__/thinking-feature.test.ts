import { describe, expect, it, vi } from 'vitest';
import { createThinkingFeature } from '../thinking-feature';

describe('createThinkingFeature', () => {
  it('menuItem has closeSilent true', () => {
    const feature = createThinkingFeature({ isThinkingOn: false, onSetThinkingLevel: vi.fn() });
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('returns a MenuItemFeature with id toggle-thinking and section Model', () => {
    const feature = createThinkingFeature({
      isThinkingOn: false,
      onSetThinkingLevel: vi.fn(),
    });
    expect(feature.id).toBe('toggle-thinking');
    expect(feature.menuItem.section).toBe('Model');
    expect(feature.menuItem.label).toBe('Thinking');
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

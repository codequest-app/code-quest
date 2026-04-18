import { describe, expect, it, vi } from 'vitest';
import { createCompactFeature } from '../compact-feature';

describe('createCompactFeature', () => {
  it('is a slash command with id compact and command /compact', () => {
    const feature = createCompactFeature(vi.fn());
    expect(feature.id).toBe('compact');
    expect(feature.slash?.command).toBe('/compact');
    expect(feature.ui?.filterOnly).toBe(true);
  });

  it('matches /compact exactly and with args', () => {
    const feature = createCompactFeature(vi.fn());
    expect(feature.slash?.match?.('/compact')).toBe(true);
    expect(feature.slash?.match?.('/compact foo')).toBe(true);
    expect(feature.slash?.match?.('  /compact  ')).toBe(true);
    expect(feature.slash?.match?.('/compactrude')).toBe(false);
    expect(feature.slash?.match?.('/other')).toBe(false);
  });

  it('invoke forwards the message to sendToCliDirectly', () => {
    const send = vi.fn();
    createCompactFeature(send).slash?.invoke('/compact summarize');
    expect(send).toHaveBeenCalledWith('/compact summarize');
  });
});

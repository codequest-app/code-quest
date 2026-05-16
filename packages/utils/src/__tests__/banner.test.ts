import { describe, expect, it } from 'vitest';
import { formatBanner } from '../banner.ts';

describe('formatBanner', () => {
  it('pads keys to equal width', () => {
    const out = formatBanner('Title', [
      { key: 'short', value: 'a' },
      { key: 'longer-key', value: 'b' },
    ]);
    expect(out).toContain('short     ');
    expect(out).toContain('longer-key');
  });

  it('uses custom icon when provided', () => {
    const out = formatBanner('T', [{ icon: '★', key: 'k', value: 'v' }]);
    expect(out).toContain('★');
  });

  it('defaults to arrow icon', () => {
    const out = formatBanner('T', [{ key: 'k', value: 'v' }]);
    expect(out).toContain('➜');
  });
});

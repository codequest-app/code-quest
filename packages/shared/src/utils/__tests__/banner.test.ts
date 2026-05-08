import { describe, expect, it } from 'vitest';
import { type BannerItem, formatBanner } from '../banner.ts';

describe('formatBanner', () => {
  it('formats title and items', () => {
    const items: BannerItem[] = [
      { key: 'Server', value: 'http://localhost:3000' },
      { key: 'Mode', value: 'remote' },
    ];
    const result = formatBanner('Code Quest', items);
    expect(result).toContain('Code Quest');
    expect(result).toContain('Server');
    expect(result).toContain('http://localhost:3000');
    expect(result).toContain('Mode');
    expect(result).toContain('remote');
  });

  it('uses default icon ➜', () => {
    const result = formatBanner('App', [{ key: 'Port', value: '3000' }]);
    expect(result).toContain('➜');
  });

  it('supports custom icon per item', () => {
    const result = formatBanner('App', [{ icon: '✓', key: 'DB', value: 'connected' }]);
    expect(result).toContain('✓');
    expect(result).not.toMatch(/➜\s+DB/);
  });

  it('aligns keys to the longest key', () => {
    const items: BannerItem[] = [
      { key: 'A', value: '1' },
      { key: 'Longer', value: '2' },
    ];
    const result = formatBanner('App', items);
    const lines = result.split('\n').filter((l) => l.includes('➜'));
    const valuePositions = lines.map((l) => l.indexOf(l.match(/\d/)![0]));
    expect(valuePositions[0]).toBe(valuePositions[1]);
  });

  it('returns empty items gracefully', () => {
    const result = formatBanner('App', []);
    expect(result).toContain('App');
  });
});

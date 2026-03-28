import { describe, expect, it } from 'vitest';
import { pluralize } from '../pluralize';

describe('pluralize', () => {
  it('returns singular when count is 1', () => {
    expect(pluralize(1, 'file')).toBe('1 file');
  });

  it('returns plural when count is 0', () => {
    expect(pluralize(0, 'file')).toBe('0 files');
  });

  it('returns plural when count is 2', () => {
    expect(pluralize(2, 'message')).toBe('2 messages');
  });

  it('supports custom plural suffix', () => {
    expect(pluralize(2, 'box', 'boxes')).toBe('2 boxes');
  });
});

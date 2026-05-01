import { describe, expect, it } from 'vitest';
import { highlight, typeColor, typeLabel } from '@/components/palette/message-preview';

describe('highlight', () => {
  it('returns single non-match segment for empty query', () => {
    expect(highlight('Hello World', '')).toEqual([{ text: 'Hello World', match: false }]);
  });

  it('returns single non-match segment when query not found', () => {
    expect(highlight('Hello World', 'foo')).toEqual([{ text: 'Hello World', match: false }]);
  });

  it('splits into three segments when query matches', () => {
    expect(highlight('Hello World', 'World')).toEqual([
      { text: 'Hello ', match: false },
      { text: 'World', match: true },
      { text: '', match: false },
    ]);
  });

  it('is case-insensitive', () => {
    expect(highlight('Hello World', 'world')).toEqual([
      { text: 'Hello ', match: false },
      { text: 'World', match: true },
      { text: '', match: false },
    ]);
  });

  it('matches first occurrence only', () => {
    const parts = highlight('foo bar foo', 'foo');
    expect(parts).toEqual([
      { text: '', match: false },
      { text: 'foo', match: true },
      { text: ' bar foo', match: false },
    ]);
  });
});

describe('typeColor', () => {
  it('returns the mapped color for known types', () => {
    expect(typeColor('text')).toBe('#81b88b');
    expect(typeColor('tool_use')).toBe('#d97757');
    expect(typeColor('error')).toBe('#f48771');
  });

  it('returns the fallback color for unknown types', () => {
    expect(typeColor('mystery_type')).toBe('#6a6a6e');
  });
});

describe('typeLabel', () => {
  it('returns the mapped display label when defined', () => {
    expect(typeLabel('redacted_thinking')).toBe('thinking (redacted)');
    expect(typeLabel('streamlined_text')).toBe('streamed text');
  });

  it('falls back to the raw type string when label not mapped', () => {
    expect(typeLabel('unknown_type_xyz')).toBe('unknown_type_xyz');
  });
});

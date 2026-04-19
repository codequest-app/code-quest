import { describe, expect, it } from 'vitest';
import type { Message } from '../../../types/ui';
import { paletteMessageResults } from '../palette-message-results';

const m = (id: string, content: string): Message => ({
  id,
  role: 'user',
  timestamp: Number(id) * 1000,
  type: 'text',
  content,
});

describe('paletteMessageResults', () => {
  const messages = Array.from({ length: 10 }, (_, i) => m(String(i + 1), `msg ${i + 1}`));

  it('returns last recentCount messages when query is empty', () => {
    expect(paletteMessageResults(messages, '').map((x) => x.id)).toEqual([
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
  });

  it('honours custom recentCount', () => {
    expect(paletteMessageResults(messages, '', { recentCount: 3 }).map((x) => x.id)).toEqual([
      '8',
      '9',
      '10',
    ]);
  });

  it('filters by query case-insensitively and caps at searchLimit', () => {
    expect(paletteMessageResults(messages, 'MSG 5').map((x) => x.id)).toEqual(['5']);
    expect(paletteMessageResults(messages, '  ').map((x) => x.id)).toEqual(
      messages.slice(-8).map((x) => x.id),
    );
    expect(paletteMessageResults(messages, 'msg', { searchLimit: 4 }).map((x) => x.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
  });
});

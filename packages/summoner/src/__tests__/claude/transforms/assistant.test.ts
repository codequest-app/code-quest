import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/fake-claude.ts';
import { toSocketEvent } from '../helpers.ts';

describe('transform — assistant events', () => {
  it('converts assistant with text/thinking/tool_use', () => {
    const base = JSON.parse(s.assistant('hello'));
    base.message.content = [
      { type: 'thinking', thinking: 'let me think...' },
      { type: 'tool_use', id: 'tu-2', name: 'Read', input: { path: 'a.ts' } },
      { type: 'text', text: 'hello' },
    ];
    const result = toSocketEvent(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'message:assistant',
      payload: {
        content: [
          { type: 'thinking', thinking: 'let me think...' },
          { type: 'tool_use', toolName: 'Read' },
          { type: 'text', text: 'hello' },
        ],
      },
    });
  });
});

import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/segments.ts';
import { toClientMessage } from '../helpers.ts';

describe('transform — user events', () => {
  it('converts user with tool_result', () => {
    const base = JSON.parse(s.toolResult('tu-1', 'output'));
    base.message.content = [
      { type: 'tool_result', tool_use_id: 'tu-1', name: 'Bash', content: 'output' },
      { type: 'text', text: 'user said' },
    ];
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'message:user',
      payload: {
        content: [
          { type: 'tool_result', toolUseId: 'tu-1' },
          { type: 'text', text: 'user said' },
        ],
      },
    });
  });

  it('preserves CLI uuid in payload', () => {
    const base = JSON.parse(s.toolResult('tu-1', 'output'));
    base.uuid = 'cli-uuid-123';
    const result = toClientMessage(JSON.stringify(base));
    const event = Array.isArray(result) ? result[0] : result;
    expect(event?.payload).toHaveProperty('uuid', 'cli-uuid-123');
  });
});

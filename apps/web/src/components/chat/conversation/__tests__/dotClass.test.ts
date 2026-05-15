import { describe, expect, it } from 'vitest';
import type { AssistantTurn, Message } from '@/types/ui';
import { msg } from '@/utils/message';
import { dotClass } from '../CollapsibleTimeline.tsx';

function make(type: Message['type'], extra: Partial<Message> = {}): Message {
  return msg({ role: 'assistant', type, content: '', ...extra } as Parameters<typeof msg>[0]);
}

function turn(hasToolUse: boolean): AssistantTurn {
  return {
    ...make('assistant_turn'),
    type: 'assistant_turn',
    blocks: hasToolUse
      ? [{ type: 'tool_use', id: '1', name: 'Bash', input: {} }]
      : [{ type: 'text', text: 'hi' }],
  } as unknown as AssistantTurn;
}

describe('dotClass', () => {
  it.each([
    'text',
    'thinking',
    'streamlined_text',
  ] as const)('%s → bg-border (no result)', (type) => {
    expect(dotClass(make(type))).toBe('bg-border');
  });

  it('assistant_turn with no tool_use blocks → bg-border', () => {
    expect(dotClass(turn(false))).toBe('bg-border');
  });

  it('assistant_turn with tool_use block + no result → bg-accent animate-pulse', () => {
    expect(dotClass(turn(true))).toBe('bg-accent animate-pulse');
  });

  it('tool_use + error result → bg-danger', () => {
    expect(dotClass(make('tool_use'), { is_error: true })).toBe('bg-danger');
  });

  it('tool_use + success result → bg-success', () => {
    expect(dotClass(make('tool_use'), { content: 'ok' })).toBe('bg-success');
  });

  it('tool_use + no result → bg-accent animate-pulse', () => {
    expect(dotClass(make('tool_use'))).toBe('bg-accent animate-pulse');
  });
});

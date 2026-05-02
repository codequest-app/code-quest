import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import { isMessageVisible } from '../isMessageVisible.ts';

function msg(overrides: Partial<Message>): Message {
  return {
    id: '1',
    role: 'assistant',
    type: 'text',
    content: '',
    timestamp: Date.now(),
    ...overrides,
  } as Message;
}

describe('isMessageVisible', () => {
  it('returns true when type is in enabledTypes', () => {
    const enabled = new Set(['text', 'tool_use']);
    expect(isMessageVisible(msg({ type: 'text' }), enabled)).toBe(true);
  });

  it('returns false when type is not in enabledTypes', () => {
    const enabled = new Set(['text']);
    expect(isMessageVisible(msg({ type: 'tool_use' }), enabled)).toBe(false);
  });

  it('tool_use with no subtype match falls back to type check', () => {
    const enabled = new Set(['tool_use']);
    expect(isMessageVisible(msg({ type: 'tool_use', content: 'Bash' }), enabled)).toBe(true);
  });

  it('tool_use:TodoRead hidden when not in enabledTypes (even if tool_use is on)', () => {
    const enabled = new Set(['tool_use']); // debug off → no tool_use:TodoRead
    expect(isMessageVisible(msg({ type: 'tool_use', content: 'TodoRead' }), enabled)).toBe(false);
  });

  it('tool_use:TodoWrite hidden when not in enabledTypes (even if tool_use is on)', () => {
    const enabled = new Set(['tool_use']);
    expect(isMessageVisible(msg({ type: 'tool_use', content: 'TodoWrite' }), enabled)).toBe(false);
  });

  it('tool_use:TodoRead visible when debug group enabled', () => {
    const enabled = new Set(['tool_use', 'tool_use:TodoRead']);
    expect(isMessageVisible(msg({ type: 'tool_use', content: 'TodoRead' }), enabled)).toBe(true);
  });

  it('tool_use:TodoWrite visible when debug group enabled', () => {
    const enabled = new Set(['tool_use', 'tool_use:TodoWrite']);
    expect(isMessageVisible(msg({ type: 'tool_use', content: 'TodoWrite' }), enabled)).toBe(true);
  });
});

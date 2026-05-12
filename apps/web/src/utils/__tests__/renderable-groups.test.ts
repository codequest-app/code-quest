import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import type { RenderGroup } from '../renderable-groups';
import { buildChildrenIndex, getGroupKey, renderableGroups } from '../renderable-groups';

function msg(overrides: Partial<Message> & { type: string; content: string }): Message {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    timestamp: Date.now(),
    ...overrides,
  } as Message;
}

describe('renderableGroups', () => {
  it('groups consecutive assistant tool_use into timeline', () => {
    const messages = [
      msg({ type: 'tool_use', content: 'Bash', toolId: 't1', input: {} }),
      msg({ type: 'tool_use', content: 'Read', toolId: 't2', input: {} }),
      msg({ type: 'tool_use', content: 'Edit', toolId: 't3', input: {} }),
    ];
    const groups = [...renderableGroups(messages)];
    expect(groups).toHaveLength(1);
    expect(groups[0]!.kind).toBe('timeline');
    if (groups[0]!.kind === 'timeline') {
      expect(groups[0]!.messages).toHaveLength(3);
    }
  });

  it('skips tool_result messages', () => {
    const messages = [
      msg({ type: 'tool_use', content: 'Bash', toolId: 't1', input: {} }),
      msg({ type: 'tool_result', content: 'output', toolId: 't1' }),
    ];
    const groups = [...renderableGroups(messages)];
    expect(groups).toHaveLength(1);
    expect(groups[0]!.kind).toBe('timeline');
  });

  it('skips messages with parentToolUseId', () => {
    const messages = [
      msg({ type: 'tool_use', content: 'Agent', toolId: 't1', input: {} }),
      msg({ type: 'text', content: 'child text', parentToolUseId: 't1' }),
    ];
    const groups = [...renderableGroups(messages)];
    expect(groups).toHaveLength(1);
  });

  it('user message breaks timeline group', () => {
    const messages = [
      msg({ type: 'tool_use', content: 'Bash', toolId: 't1', input: {} }),
      msg({ type: 'text', content: 'user msg', role: 'user' }),
      msg({ type: 'tool_use', content: 'Read', toolId: 't2', input: {} }),
    ];
    const groups = [...renderableGroups(messages)];
    expect(groups).toHaveLength(3);
    expect(groups[0]!.kind).toBe('timeline');
    expect(groups[1]!.kind).toBe('single');
    expect(groups[2]!.kind).toBe('timeline');
  });

  it('system result is a single item', () => {
    const messages = [msg({ type: 'result', content: '', role: 'system', stats: {} })];
    const groups = [...renderableGroups(messages)];
    expect(groups).toHaveLength(1);
    expect(groups[0]!.kind).toBe('single');
  });

  it('tracks prevRole for avatar display', () => {
    const messages = [
      msg({ type: 'text', content: 'hi', role: 'user' }),
      msg({ type: 'text', content: 'hello', role: 'assistant' }),
    ];
    const groups = [...renderableGroups(messages)];
    expect(groups[0]!.prevRole).toBeNull();
    expect(groups[1]!.prevRole).toBe('user');
  });
});

describe('getGroupKey', () => {
  // biome-ignore lint/suspicious/noExplicitAny: test stubs
  const m = (id: string) => ({ id }) as any;

  it('single group returns message id', () => {
    const group: RenderGroup = { kind: 'single', message: m('msg-1'), prevRole: null };
    expect(getGroupKey(group, 0)).toBe('msg-1');
  });

  it('timeline group with one message returns first message id', () => {
    const group: RenderGroup = { kind: 'timeline', messages: [m('user-1')], prevRole: null };
    expect(getGroupKey(group, 0)).toBe('user-1');
  });

  it('timeline group key is stable when second message is added', () => {
    const before: RenderGroup = { kind: 'timeline', messages: [m('user-1')], prevRole: null };
    const after: RenderGroup = {
      kind: 'timeline',
      messages: [m('user-1'), m('asst-1')],
      prevRole: null,
    };
    expect(getGroupKey(before, 0)).toBe(getGroupKey(after, 0));
  });

  it('timeline group key is stable when third message is added', () => {
    const two: RenderGroup = {
      kind: 'timeline',
      messages: [m('user-1'), m('asst-1')],
      prevRole: null,
    };
    const three: RenderGroup = {
      kind: 'timeline',
      messages: [m('user-1'), m('asst-1'), m('tool-1')],
      prevRole: null,
    };
    expect(getGroupKey(two, 0)).toBe(getGroupKey(three, 0));
  });

  it('fallback to stable string when timeline has no messages', () => {
    const group: RenderGroup = { kind: 'timeline', messages: [], prevRole: null };
    expect(getGroupKey(group, 5)).toBe('timeline-5');
  });
});

describe('buildChildrenIndex', () => {
  it('groups messages by parentToolUseId', () => {
    const messages = [
      msg({ type: 'text', content: 'child1', parentToolUseId: 't1' }),
      msg({
        type: 'tool_use',
        content: 'Bash',
        parentToolUseId: 't1',
        toolId: 't2',
        input: {},
      }),
      msg({ type: 'text', content: 'other', parentToolUseId: 't2' }),
    ];
    const index = buildChildrenIndex(messages);
    expect(index.get('t1')).toHaveLength(2);
    expect(index.get('t2')).toHaveLength(1);
  });

  it('returns empty map when no children', () => {
    const messages = [msg({ type: 'text', content: 'hello' })];
    const index = buildChildrenIndex(messages);
    expect(index.size).toBe(0);
  });
});

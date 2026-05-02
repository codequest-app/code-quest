import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import { buildMessagesFromHistory } from '../message.ts';

describe('buildMessagesFromHistory', () => {
  it('returns empty array for empty events', () => {
    expect(buildMessagesFromHistory([])).toEqual([]);
  });

  it('converts message:assistant text block', () => {
    const events = [
      {
        name: 'message:assistant',
        payload: {
          content: [{ type: 'text', text: 'Hello world' }],
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.role).toBe('assistant');
    expect(msgs[0]!.type).toBe('text');
    expect(msgs[0]!.content).toBe('Hello world');
  });

  it('converts message:assistant thinking block', () => {
    const events = [
      {
        name: 'message:assistant',
        payload: {
          content: [{ type: 'thinking', thinking: 'Let me analyze...' }],
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.type).toBe('thinking');
    expect(msgs[0]!.content).toBe('Let me analyze...');
  });

  it('converts message:assistant tool_use block', () => {
    const events = [
      {
        name: 'message:assistant',
        payload: {
          content: [
            { type: 'tool_use', toolName: 'Read', toolId: 'tu-1', input: { file_path: 'x.ts' } },
          ],
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.type).toBe('tool_use');
    expect(msgs[0]!.content).toBe('Read');
    expect(msgs[0]!.meta).toMatchObject({ toolId: 'tu-1' });
  });

  it('converts message:user tool_result block', () => {
    const events = [
      {
        name: 'message:user',
        payload: {
          content: [
            { type: 'tool_result', toolUseId: 'tu-1', toolName: 'Read', content: 'file contents' },
          ],
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.type).toBe('tool_result');
    expect(msgs[0]!.content).toBe('file contents');
  });

  it('converts message:user text block', () => {
    const events = [
      {
        name: 'message:user',
        payload: {
          content: [{ type: 'text', text: 'User message' }],
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.role).toBe('user');
    expect(msgs[0]!.content).toBe('User message');
  });

  it('plumbs uuid from history payload to cliUuid (fix-fork-message-uuid)', () => {
    const events = [
      {
        name: 'message:user',
        payload: {
          content: [{ type: 'text', text: 'historical msg' }],
          uuid: 'cli-uuid-from-history',
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.cliUuid).toBe('cli-uuid-from-history');
  });

  it('converts message:result with stats', () => {
    const events = [
      {
        name: 'message:result',
        payload: {
          stats: {
            totalCostUsd: 0.05,
            durationMs: 3000,
            inputTokens: 1000,
            outputTokens: 500,
            numTurns: 3,
          },
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.type).toBe('result');
    const resultMsg = msgs[0] as Extract<Message, { type: 'result' }>;
    expect(resultMsg.meta?.stats).toMatchObject({
      costUsd: 0.05,
      durationMs: 3000,
      inputTokens: 1000,
      outputTokens: 500,
      numTurns: 3,
    });
  });

  it('handles multi-block assistant message', () => {
    const events = [
      {
        name: 'message:assistant',
        payload: {
          content: [
            { type: 'thinking', thinking: 'hmm' },
            { type: 'text', text: 'answer' },
            { type: 'tool_use', toolName: 'Write', toolId: 'tu-2', input: {} },
          ],
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(3);
    expect(msgs[0]!.type).toBe('thinking');
    expect(msgs[1]!.type).toBe('text');
    expect(msgs[2]!.type).toBe('tool_use');
  });

  it('preserves parentToolUseId', () => {
    const events = [
      {
        name: 'message:assistant',
        payload: {
          content: [{ type: 'text', text: 'sub-agent output' }],
          parentToolUseId: 'parent-tu-1',
        },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs[0]!.parentToolUseId).toBe('parent-tu-1');
  });

  it('handles full conversation sequence', () => {
    const events = [
      {
        name: 'message:assistant',
        payload: { content: [{ type: 'text', text: 'Hello' }] },
      },
      {
        name: 'message:assistant',
        payload: {
          content: [{ type: 'tool_use', toolName: 'Read', toolId: 'tu-1', input: {} }],
        },
      },
      {
        name: 'message:user',
        payload: {
          content: [{ type: 'tool_result', toolUseId: 'tu-1', content: 'data' }],
        },
      },
      {
        name: 'message:result',
        payload: { stats: { totalCostUsd: 0.01, inputTokens: 100, outputTokens: 50 } },
      },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(4);
    expect(msgs.map((m) => m.type)).toEqual(['text', 'tool_use', 'tool_result', 'result']);
  });

  it('ignores unknown event names', () => {
    const events = [
      { name: 'unknown:event', payload: { data: 'ignored' } },
      { name: 'message:assistant', payload: { content: [{ type: 'text', text: 'kept' }] } },
    ];
    const msgs = buildMessagesFromHistory(events);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.content).toBe('kept');
  });
});

/* biome-ignore-all lint/suspicious/noExplicitAny: test stubs */
import type { ClientMessage } from '@code-quest/schemas';
import { EVENTS } from '@code-quest/schemas';
import { describe, expect, it } from 'vitest';
import { extractPendingControlRequests, filterReplayEvents } from '../history.ts';

type ParsedEvent = { direction: 'in' | 'out'; obj: Record<string, unknown> };

const out = (obj: Record<string, unknown> = {}): ParsedEvent => ({ direction: 'out', obj });
const inn = (obj: Record<string, unknown> = {}): ParsedEvent => ({ direction: 'in', obj });

describe('filterReplayEvents', () => {
  it('includes all out events regardless of hasStdoutUserEcho', () => {
    const events = [out({ type: 'assistant' }), out({ type: 'result' })];
    expect(filterReplayEvents(events, true)).toEqual(events);
    expect(filterReplayEvents(events, false)).toEqual(events);
  });

  it('includes in events when hasStdoutUserEcho is false', () => {
    const events = [inn({ role: 'user' }), out({ type: 'assistant' })];
    const result = filterReplayEvents(events, false);
    expect(result).toHaveLength(2);
  });

  it('excludes in events when hasStdoutUserEcho is true', () => {
    const events = [inn({ role: 'user' }), out({ type: 'assistant' })];
    const result = filterReplayEvents(events, true);
    expect(result).toHaveLength(1);
    expect(result[0]?.direction).toBe('out');
  });

  it('returns empty array when no events', () => {
    expect(filterReplayEvents([], true)).toEqual([]);
    expect(filterReplayEvents([], false)).toEqual([]);
  });
});

const permMsg = (requestId: string): ClientMessage =>
  ({ name: EVENTS.control.permission, payload: { requestId } }) as any;
const elicitMsg = (requestId: string): ClientMessage =>
  ({ name: EVENTS.control.elicitation, payload: { requestId } }) as any;
const cancelMsg = (requestId: string): ClientMessage =>
  ({ name: EVENTS.control.cancel, payload: { requestId } }) as any;
const otherMsg = (): ClientMessage => ({ name: EVENTS.message.user, payload: {} }) as any;

describe('extractPendingControlRequests', () => {
  it('returns pending permission requests', () => {
    const result = extractPendingControlRequests([permMsg('r1')], new Set());
    expect(result).toHaveLength(1);
    expect(result[0]?.requestId).toBe('r1');
  });

  it('returns pending elicitation requests', () => {
    const result = extractPendingControlRequests([elicitMsg('r1')], new Set());
    expect(result).toHaveLength(1);
    expect(result[0]?.requestId).toBe('r1');
  });

  it('excludes already responded requests', () => {
    const result = extractPendingControlRequests([permMsg('r1')], new Set(['r1']));
    expect(result).toHaveLength(0);
  });

  it('cancel message removes corresponding pending request', () => {
    const messages = [permMsg('r1'), cancelMsg('r1')];
    const result = extractPendingControlRequests(messages, new Set());
    expect(result).toHaveLength(0);
  });

  it('cancel does not affect other pending requests', () => {
    const messages = [permMsg('r1'), permMsg('r2'), cancelMsg('r1')];
    const result = extractPendingControlRequests(messages, new Set());
    expect(result).toHaveLength(1);
    expect(result[0]?.requestId).toBe('r2');
  });

  it('ignores non-control messages', () => {
    const result = extractPendingControlRequests([otherMsg(), permMsg('r1')], new Set());
    expect(result).toHaveLength(1);
  });
});

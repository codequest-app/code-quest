import type { ClientMessage } from '@code-quest/shared';
import { expect } from 'vitest';
import { ClaudeAdapter } from '../../claude/adapter.ts';
import type { ProtocolMessage } from '../../claude/schemas.ts';

export const adapter = new ClaudeAdapter();

/** Extract the ProtocolMessage from a parseLine result. Generic so callers get
 *  a narrowed type for fallback (`unknown`/`error`) branches without casting. */
function parseMessage<T = ProtocolMessage>(line: string): T | null {
  const parsed = adapter.parseLine(line);
  if (parsed.status === 'ok') return parsed.message as T;
  if (parsed.status === 'unknown') return parsed.data as T;
  if (parsed.status === 'error') return JSON.parse(parsed.raw) as T;
  return null;
}

/** Helper: parseLine + transform → extract single ClientMessage (or null / array) */
export function toClientMessage(line: string) {
  const event = parseMessage(line);
  if (!event) return null;
  const r = adapter.transform(event);
  return r.messages.length === 0 ? null : r.messages.length === 1 ? r.messages[0] : r.messages;
}

/** Narrow a ClientMessage (or array/null) to a specific variant. Fails test if mismatched. */
export function expectName<N extends ClientMessage['name']>(
  msg: ClientMessage | ClientMessage[] | null,
  name: N,
): Extract<ClientMessage, { name: N }> {
  expect(msg).not.toBeNull();
  if (Array.isArray(msg))
    throw new Error(`expected single ClientMessage, got array of ${msg.length}`);
  if (!msg) throw new Error('expected ClientMessage, got null');
  expect(msg.name).toBe(name);
  return msg as Extract<ClientMessage, { name: N }>;
}

export function transformResult(line: string) {
  const event = parseMessage(line);
  if (!event) return { messages: [], controlResponses: [] };
  return adapter.transform(event);
}

// biome-ignore-all lint/suspicious/noExplicitAny: ClientMessage payload is Record<string,unknown>, needs cast in assertions
import { ClaudeAdapter } from '../../claude/adapter.ts';

export const adapter = new ClaudeAdapter();

/** Extract the ProtocolMessage from a parseLine result */
export function parseEvent(line: string) {
  const parsed = adapter.parseLine(line);
  if (parsed.status === 'ok') return parsed.event;
  if (parsed.status === 'unknown') return parsed.data as any;
  if (parsed.status === 'error') return JSON.parse(parsed.raw) as any;
  return null;
}

/** Helper: parseLine + transform → extract single ClientMessage (or null / array) */
export function toClientMessage(line: string) {
  const event = parseEvent(line);
  if (!event) return null;
  const r = adapter.transform(event);
  return r.events.length === 0 ? null : r.events.length === 1 ? r.events[0] : r.events;
}

export function transformResult(line: string) {
  const event = parseEvent(line);
  if (!event) return { events: [], controlResponses: [], serverActions: [] };
  return adapter.transform(event);
}

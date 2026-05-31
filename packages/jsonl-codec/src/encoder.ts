import type { RawEvent } from '@code-quest/summoner';

const SKIP_TYPES = new Set(['stream_event', 'control_request', 'control_response']);

export class JsonlEncoder {
  writeLine(event: RawEvent): string | null {
    if (event.direction === 'err') return null;
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(event.raw) as Record<string, unknown>;
    } catch {
      return null;
    }
    const type = entry.type;
    if (typeof type !== 'string') return null;
    if (SKIP_TYPES.has(type)) return null;
    // dir:out user entries are either echoes of stdin (text) or CLI-generated tool results.
    // Only keep tool results; skip echoes to avoid duplicates with dir:in user entries.
    if (event.direction === 'out' && type === 'user') {
      const msg = entry.message;
      const content =
        msg !== null && typeof msg === 'object'
          ? (msg as Record<string, unknown>).content
          : undefined;
      const firstBlock = Array.isArray(content) ? (content[0] as Record<string, unknown>) : null;
      const isToolResult = firstBlock?.type === 'tool_result';
      if (!isToolResult) return null;
    }
    return event.raw;
  }
}

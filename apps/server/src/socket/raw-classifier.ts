import { isRecord } from '@code-quest/utils';

/** Return true when the raw line is a stream_event carrying a content_block_delta.
 *  These are the high-volume token-streaming events; persisted to raw_deltas
 *  separately from raw_events.
 *
 *  Malformed JSON or any other shape returns false (falls through to the
 *  raw_events catch-all path). */
export function isDelta(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return false;
    if (parsed.type !== 'stream_event') return false;
    if (!isRecord(parsed.event)) return false;
    return parsed.event.type === 'content_block_delta';
  } catch {
    return false;
  }
}

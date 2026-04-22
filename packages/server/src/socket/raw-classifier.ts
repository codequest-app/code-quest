/** Return true when the raw line is a stream_event carrying a content_block_delta.
 *  These are the high-volume token-streaming events; persisted to raw_deltas
 *  separately from raw_events.
 *
 *  Malformed JSON or any other shape returns false (falls through to the
 *  raw_events catch-all path). */
export function isDelta(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return false;
    const obj = parsed as Record<string, unknown>;
    if (obj.type !== 'stream_event') return false;
    const ev = obj.event;
    if (typeof ev !== 'object' || ev === null) return false;
    return (ev as Record<string, unknown>).type === 'content_block_delta';
  } catch {
    return false;
  }
}

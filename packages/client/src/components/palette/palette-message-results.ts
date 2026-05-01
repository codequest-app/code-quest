import type { Message } from '@/types/ui';
import { messagePreview } from '@/utils/message-preview';

export const PALETTE_RECENT_COUNT = 8;
export const PALETTE_SEARCH_LIMIT = 50;

interface PaletteMessageResultsOptions {
  recentCount?: number;
  searchLimit?: number;
  sourceLabels?: Map<string, string>;
}

export function paletteMessageResults(
  messages: Message[],
  query: string,
  {
    recentCount = PALETTE_RECENT_COUNT,
    searchLimit = PALETTE_SEARCH_LIMIT,
    sourceLabels,
  }: PaletteMessageResultsOptions = {},
): Message[] {
  const q = query.trim().toLowerCase();
  if (q) {
    return messages
      .filter((m) => messagePreview(m).toLowerCase().includes(q))
      .slice(0, searchLimit);
  }

  if (sourceLabels && sourceLabels.size > 0) {
    const buckets = new Map<string, Message[]>();
    for (const msg of messages) {
      const source = sourceLabels.get(msg.id);
      if (source == null) continue;
      let bucket = buckets.get(source);
      if (!bucket) {
        bucket = [];
        buckets.set(source, bucket);
      }
      bucket.push(msg);
    }
    const result: Message[] = [];
    for (const bucket of buckets.values()) {
      result.push(...bucket.slice(-recentCount));
    }
    return result;
  }

  return messages.slice(-recentCount);
}

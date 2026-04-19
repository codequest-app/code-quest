import type { Message } from '../../types/ui';
import { messagePreview } from '../../utils/isMessageVisible';

export const PALETTE_RECENT_COUNT = 8;
export const PALETTE_SEARCH_LIMIT = 50;

export interface PaletteMessageResultsOptions {
  recentCount?: number;
  searchLimit?: number;
}

export function paletteMessageResults(
  messages: Message[],
  query: string,
  {
    recentCount = PALETTE_RECENT_COUNT,
    searchLimit = PALETTE_SEARCH_LIMIT,
  }: PaletteMessageResultsOptions = {},
): Message[] {
  const q = query.trim().toLowerCase();
  return q
    ? messages.filter((m) => messagePreview(m).toLowerCase().includes(q)).slice(0, searchLimit)
    : messages.slice(-recentCount);
}

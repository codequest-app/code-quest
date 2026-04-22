import type { RawEvent } from '@code-quest/summoner';
import { z } from 'zod';
import { logger } from '../logger.ts';

export const sessionPreviewSchema = z.object({
  lastAssistant: z.string().optional(),
  firstUser: z.string().optional(),
});
export type SessionPreview = z.infer<typeof sessionPreviewSchema>;

const rawTextMessageSchema = z.object({
  type: z.string(),
  message: z.object({
    content: z.array(z.looseObject({ type: z.string(), text: z.string().optional() })),
  }),
});

/** Extract text content from a raw JSON entry if it matches the given type. */
export function extractTextFromRaw(raw: string, type: 'user' | 'assistant'): string | undefined {
  try {
    const result = rawTextMessageSchema.safeParse(JSON.parse(raw));
    if (!result.success || result.data.type !== type) return undefined;
    const textBlock = result.data.message.content.find((b) => b.type === 'text');
    return textBlock?.text;
  } catch (err) {
    logger.debug(err, 'failed to parse raw event content');
  }
  return undefined;
}

export interface RawEventStore {
  /**
   * Append a raw event. Returns the primary-key id of the inserted row.
   * If `id` is provided, the store uses it verbatim; otherwise one is generated.
   * Composite stores use this to share the same id across all backing stores,
   * so downstream references (e.g. raw_deltas.parent_id) remain consistent.
   */
  append(event: RawEvent, id?: string): Promise<string>;
  getBySession(sessionId: string): Promise<RawEvent[]>;
  getPreview(sessionId: string): Promise<SessionPreview>;
  cloneEvents(fromSessionId: string, toSessionId: string): Promise<void>;
}

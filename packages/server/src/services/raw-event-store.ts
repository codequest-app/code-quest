import type { RawEntry } from '@code-quest/summoner';
import { z } from 'zod';
import { logger } from '../logger.ts';

export interface SessionPreview {
  lastAssistant?: string;
  firstUser?: string;
}

const rawTextMessageSchema = z.object({
  type: z.string(),
  message: z.object({
    content: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()),
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
  append(entry: RawEntry): Promise<void>;
  getBySession(sessionId: string): Promise<RawEntry[]>;
  getPreview(sessionId: string): Promise<SessionPreview>;
  cloneEvents(fromSessionId: string, toSessionId: string): Promise<void>;
}

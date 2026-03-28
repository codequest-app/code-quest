import type { RawEntry } from '@code-quest/summoner';

export interface SessionPreview {
  lastAssistant?: string;
}

/** Extract text content from a raw JSON entry if it matches the given type. */
export function extractTextFromRaw(raw: string, type: 'user' | 'assistant'): string | undefined {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type !== type) return undefined;
    const content = parsed.message?.content;
    if (Array.isArray(content)) {
      const textBlock = content.find((b: { type: string }) => b.type === 'text');
      return textBlock?.text;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

export interface RawEventStore {
  append(entry: RawEntry): Promise<void>;
  getBySession(sessionId: string): Promise<RawEntry[]>;
  getPreview(sessionId: string): Promise<SessionPreview>;
}

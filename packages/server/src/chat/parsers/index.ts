import type { ChatProvider } from '@code-quest/shared';
import type { StreamParser } from '../types.ts';
import { ClaudeStreamParser } from './claude-parser.ts';
import { GeminiStreamParser } from './gemini-parser.ts';

export function createParser(provider: ChatProvider): StreamParser {
  switch (provider) {
    case 'claude':
      return new ClaudeStreamParser();
    case 'gemini':
      return new GeminiStreamParser();
  }
}

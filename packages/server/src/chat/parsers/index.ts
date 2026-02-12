import type { ChatProvider, StreamParser } from '../types';
import { ClaudeStreamParser } from './claude-parser';
import { GeminiStreamParser } from './gemini-parser';

export function createParser(provider: ChatProvider): StreamParser {
  switch (provider) {
    case 'claude':
      return new ClaudeStreamParser();
    case 'gemini':
      return new GeminiStreamParser();
  }
}

export { ClaudeStreamParser } from './claude-parser';
export { GeminiStreamParser } from './gemini-parser';

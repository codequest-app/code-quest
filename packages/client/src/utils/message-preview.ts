import type { Message } from '../types/ui';
import { MESSAGE_TYPE_LABELS } from './message-type-labels';

const TYPE_COLORS: Partial<Record<string, string>> = {
  text: '#81b88b',
  thinking: '#9d7fd4',
  redacted_thinking: '#9d7fd4',
  tool_use: '#d97757',
  tool_result: '#c6913f',
  error: '#f48771',
  result: '#e1c08d',
  hook_started: '#5a9fd4',
  hook_response: '#5a9fd4',
  hook_diagnostics: '#5a9fd4',
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#6a6a6e';
}

export function typeLabel(type: string): string {
  return MESSAGE_TYPE_LABELS[type as Message['type']] ?? type;
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Splits `text` into at most 3 segments around the first case-insensitive
 *  occurrence of `query`. Returns a single non-match segment if query is empty
 *  or not found. */
export function highlight(text: string, query: string): HighlightSegment[] {
  if (!query) return [{ text, match: false }];
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return [{ text, match: false }];
  return [
    { text: text.slice(0, idx), match: false },
    { text: text.slice(idx, idx + query.length), match: true },
    { text: text.slice(idx + query.length), match: false },
  ];
}

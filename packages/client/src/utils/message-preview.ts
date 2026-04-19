import type { Message } from '../types/ui';

const MESSAGE_TYPE_LABELS: Partial<Record<Message['type'], string>> = {
  streamlined_tool_use_summary: 'tool summary',
  streamlined_text: 'streamed text',
  content_block_start: 'block start',
  redacted_thinking: 'thinking (redacted)',
  slash_command_result: 'slash command',
  compact_boundary: 'compact boundary',
  rate_limit_event: 'rate limit',
  pending_action: 'pending action',
  action_result: 'action result',
  task_started: 'task started',
  hook_started: 'hook started',
  hook_response: 'hook response',
  hook_diagnostics: 'hook diagnostics',
  unknown_delta: 'unknown delta',
  raw_event: 'raw event',
  tool_use: 'tool use',
  tool_result: 'tool result',
};

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

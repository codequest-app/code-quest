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

// Message-type badge palette used by the command palette's message preview list.
// Hex values are inlined in CSS `style` with alpha suffixes (`${color}18`) so
// they must remain literal hex strings for the suffix concatenation to work.
const TYPE_COLOR_GREEN = '#81b88b';
const TYPE_COLOR_PURPLE = '#9d7fd4';
const TYPE_COLOR_ORANGE = '#d97757';
const TYPE_COLOR_AMBER = '#c6913f';
const TYPE_COLOR_RED = '#f48771';
const TYPE_COLOR_GOLD = '#e1c08d';
const TYPE_COLOR_BLUE = '#5a9fd4';
const TYPE_COLOR_DEFAULT = '#6a6a6e';

const TYPE_COLORS: Partial<Record<string, string>> = {
  text: TYPE_COLOR_GREEN,
  thinking: TYPE_COLOR_PURPLE,
  redacted_thinking: TYPE_COLOR_PURPLE,
  tool_use: TYPE_COLOR_ORANGE,
  tool_result: TYPE_COLOR_AMBER,
  error: TYPE_COLOR_RED,
  result: TYPE_COLOR_GOLD,
  hook_started: TYPE_COLOR_BLUE,
  hook_response: TYPE_COLOR_BLUE,
  hook_diagnostics: TYPE_COLOR_BLUE,
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? TYPE_COLOR_DEFAULT;
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

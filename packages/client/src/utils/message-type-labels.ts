import type { Message } from '../types/ui';

export const MESSAGE_TYPE_LABELS: Partial<Record<Message['type'], string>> = {
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

export type SessionStatus =
  | 'disconnected'
  | 'idle'
  | 'processing'
  | 'connecting'
  | 'busy'
  | 'cancelling';

export type RewindFn = (
  messageId: string,
  dryRun: boolean,
) => Promise<{ success: boolean; response?: Record<string, unknown>; error?: string }>;

export type ForkFn = (
  messageId: string,
) => Promise<{ success: boolean; channelId?: string; error?: string }>;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type:
    | 'text'
    | 'thinking'
    | 'tool_use'
    | 'tool_result'
    | 'result'
    | 'error'
    | 'pending_action'
    | 'action_result'
    | 'task_started'
    | 'compact_boundary'
    | 'streamlined_text'
    | 'streamlined_tool_use_summary'
    | 'rate_limit_event'
    | 'hook_started'
    | 'hook_response'
    | 'hook_diagnostics'
    | 'unknown_delta'
    | 'raw_event'
    | 'unhandled'
    | 'content_block_start'
    | 'file_updated'
    | 'image'
    | 'document'
    | 'meta'
    | 'interrupt'
    | 'slash_command_result';
  content: string;
  meta?: Record<string, unknown>;
  parentToolUseId?: string;
  timestamp: number;
  attachments?: Array<{ filename: string; startLine?: number; endLine?: number }>;
}

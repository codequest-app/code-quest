import type { ResultMeta, RewindResult, ToolResultMeta, ToolUseMeta } from '@code-quest/shared';

export type {
  ResultMeta,
  RewindResult,
  ToolResult,
  ToolResultMeta,
  ToolUseMeta,
} from '@code-quest/shared';

export type SessionStatus =
  | 'disconnected'
  | 'idle'
  | 'processing'
  | 'connecting'
  | 'busy'
  | 'cancelling';

export type RewindFn = (messageId: string, dryRun: boolean) => Promise<RewindResult>;

export type ForkFn = (
  messageId: string,
) => Promise<{ success: boolean; channelId?: string; error?: string }>;

// ── Client-only message meta types ──

interface TextMeta {
  citations?: Array<{ url?: string; title?: string; citedText?: string }>;
}

interface ThinkingMeta {
  budget_tokens?: number;
  durationMs?: number | null;
  isStreaming?: boolean;
}

export interface HookStartedMeta {
  hookEvent?: string;
}

export interface HookResponseMeta {
  output?: string;
}

export interface HookDiagnosticsMeta {
  diagnostics?: string;
}

export interface ImageMeta {
  source?: { type?: string; media_type?: string; data?: string };
}

export interface DocumentMeta {
  title?: string;
  source?: { type?: string; media_type?: string; data?: string };
}

export interface RateLimitMeta {
  rateLimitInfo?: Record<string, unknown>;
}

// ── Message type discriminated union ──

interface MessageBase {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parentToolUseId?: string;
  timestamp: number;
  attachments?: Array<{ filename: string; startLine?: number; endLine?: number }>;
}

/** Maps message types that carry required typed meta to their meta shape */
interface MetaMap {
  tool_use: ToolUseMeta;
  tool_result: ToolResultMeta;
  result: ResultMeta;
}

/** Maps message types with optional typed meta */
interface OptionalMetaMap {
  text: TextMeta;
  thinking: ThinkingMeta;
}

type MessageType =
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
  | 'file:updated'
  | 'image'
  | 'document'
  | 'meta'
  | 'interrupt'
  | 'redacted_thinking'
  | 'slash_command_result';

/** Typed message variant — meta is typed for known types, loose for others */
export type Message = {
  [T in MessageType]: T extends keyof MetaMap
    ? MessageBase & { type: T; meta: MetaMap[T] & Record<string, unknown> }
    : T extends keyof OptionalMetaMap
      ? MessageBase & { type: T; meta?: OptionalMetaMap[T] & Record<string, unknown> }
      : MessageBase & { type: T; meta?: Record<string, unknown> };
}[MessageType];

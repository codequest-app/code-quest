import type {
  ForkConversationResponse,
  MessageAttachment,
  MessageRole,
  ResultMeta,
  RewindResult,
  RpcResult,
  ToolResultMeta,
  ToolUseMeta,
  UserSource,
} from '@code-quest/shared';

export type { ResultMeta, RewindResult, ToolResultMeta, ToolUseMeta } from '@code-quest/shared';

export type SessionStatus =
  | 'disconnected'
  | 'idle'
  | 'processing'
  | 'connecting'
  | 'busy'
  | 'cancelling';

export type RewindFn = (messageId: string) => Promise<RpcResult<RewindResult>>;

export type ForkFn = (messageId: string) => Promise<ForkConversationResponse>;

// ── Client-only message meta types ──

interface TextMeta {
  citations?: Array<{ url?: string; title?: string; citedText?: string }>;
  source?: UserSource;
}

interface ThinkingMeta {
  budget_tokens?: number;
  durationMs?: number | null;
  isStreaming?: boolean;
}

interface ErrorMeta {
  detail?: string;
}

// ── UI-layer meta shapes (React prop types) ──

export interface HookStartedMeta {
  hookEvent?: string;
  hookId?: string;
  hookName?: string;
}

export interface HookResponseMeta {
  output?: string;
  hookEvent?: string;
  hookId?: string;
  hookName?: string;
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

/** UI-layer message base — after adapter projection. id/timestamp are
 *  UI-assigned; attachments are UI concepts (file mentions). */
export interface MessageBase {
  id: string;
  /** JSONL-canonical uuid assigned by CLI/server. Absent until CLI echoes the message. */
  cliUuid?: string;
  role: MessageRole;
  content: string;
  parentToolUseId?: string;
  timestamp: number;
  attachments?: MessageAttachment[];
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
  error: ErrorMeta;
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
    ? MessageBase & { type: T; meta: MetaMap[T] }
    : T extends keyof OptionalMetaMap
      ? MessageBase & { type: T; meta?: OptionalMetaMap[T] }
      : MessageBase & { type: T; meta?: Record<string, unknown> };
}[MessageType];

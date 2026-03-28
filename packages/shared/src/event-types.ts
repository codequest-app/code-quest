/**
 * Shared types for socket event payloads.
 *
 * Sub-types (ContentBlock, StreamChunk, SessionStats, etc.) are used by
 * ServerToClientEvents payload definitions and SocketEvent type.
 */

// ── Message content blocks (flattened from assistant/user content arrays) ──

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  toolId: string;
  toolName: string;
  input: unknown;
}

export interface ToolResultBlock {
  type: 'tool_result';
  toolUseId: string;
  toolName?: string;
  content: unknown;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock;

// ── Stream chunks (assembled from deltas on the server) ──

export interface StreamChunk {
  /** What is being streamed */
  kind: 'text' | 'thinking' | 'input_json' | 'citations' | 'signature';
  /** Accumulated text so far (for text/thinking), or partial JSON (for input_json) */
  content: string;
  /** For citations */
  citations?: unknown[];
}

// ── Session stats (extracted from result event) ──

export interface SessionStats {
  totalCostUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  numTurns?: number;
  modelUsage?: Record<string, unknown>;
}

// ── Rate limit info ──

export interface RateLimitInfo {
  status: string;
  rateLimitType?: string;
  resetsAt?: string;
  utilization?: Record<string, unknown>;
  overageStatus?: string;
  isUsingOverage?: boolean;
}

// ── Permission request (tool approval) ──

export interface PermissionRequest {
  requestId: string;
  toolName: string;
  toolUseId?: string;
  input: unknown;
  suggestions?: unknown[];
  callbackId?: string;
  blockedPath?: string;
  decisionReason?: string;
  agentId?: string;
}

// ── Elicitation request ──

export interface ElicitationRequest {
  requestId: string;
  prompt: string;
  inputType: 'text' | 'url' | 'select';
  options?: string[];
  url?: string;
  elicitationId?: string;
  mcpServerName?: string;
  requestedSchema?: Record<string, unknown>;
}

// ── Diff review request ──

export interface DiffReviewRequest {
  toolId: string;
  filePath: string;
  oldContent: string;
  newContent: string;
}

// ── MCP message request ──

export interface McpMessageRequest {
  requestId: string;
  serverName: string;
  message: Record<string, unknown>;
}

// ── Hook info ──

// ── Hook callback request (forwarded to client for decision) ──

export interface HookCallbackRequest {
  requestId: string;
  callbackId: string;
  input: unknown;
  toolUseId?: string;
}

// ── Remote control state ──

export interface RemoteControlStateInfo {
  state: 'ready' | 'disconnected' | 'error';
  detail?: string;
}

export interface HookStartedInfo {
  hookName: string;
  hookId: string;
  hookEvent: string;
}

export interface HookResponseInfo {
  hookName: string;
  hookId: string;
  hookEvent: string;
  hookEventName?: string;
  output?: string;
  additionalContext?: string;
}

// ── SocketEvent — named event ready for socket.emit ──

export interface SocketEvent {
  name: string;
  payload: Record<string, unknown>;
}

// ── Control response (shared across server, summoner, client) ──

export interface ControlResponse {
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
}

// ── Model info (shared across server and client) ──

export interface ModelInfo {
  value: string;
  label?: string;
  displayName?: string;
  description?: string;
  supportsEffort?: boolean;
  supportedEffortLevels?: string[];
  supportsAdaptiveThinking?: boolean;
  supportsFastMode?: boolean;
}

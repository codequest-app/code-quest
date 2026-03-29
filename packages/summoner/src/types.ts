import type { ChildProcess, SpawnOptions } from 'node:child_process';
import type { ChatStats } from '@code-quest/shared';

export type { ControlPermissionResponse } from '@code-quest/shared';

// --- Chat stream events (discriminated union) ---

export type ChatStreamEvent =
  | { type: 'init'; sessionId: string; model?: string; tools?: unknown[] }
  | { type: 'status'; message: string }
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: string }
  | { type: 'result'; stats: ChatStats }
  | {
      type: 'control_response';
      requestId: string;
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }
  | { type: 'text_delta'; content: string }
  | { type: 'thinking_delta'; content: string }
  | { type: 'message_end' }
  | {
      type: 'control_request';
      requestId: string;
      subtype: string;
      toolName?: string;
      input?: unknown;
      callbackId?: string;
      toolUseId?: string;
    };

// --- Process factory (spawn-style) ---

export type ProcessFactory = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

// --- Raw entry for recording ---

export interface RawEntry {
  timestamp: number;
  sessionId: string;
  promptId: string;
  direction: 'in' | 'out' | 'err';
  raw: string;
  seq: number;
}

// --- Control response ---

export interface ControlResponseEvent {
  requestId: string;
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
}

export interface InitializeOptions {
  hooks?: Record<string, Array<{ matcher: string; hookCallbackIds: string[]; timeout?: number }>>;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  jsonSchema?: Record<string, unknown>;
  agents?: Record<string, unknown>;
  resumeSessionAt?: string;
}

// --- ProcessHandle / ProcessProvider ---

export interface ProcessHandle {
  /** Raw lines from process output (one string per line, no newline) */
  lines: AsyncIterable<string>;
  /** Write a raw string to stdin (newline appended by implementation) */
  send(raw: string): void;
  /** AbortSignal for cancellation propagation */
  signal: AbortSignal;
  /** Terminate the process */
  abort(): void;
}

export interface ProcessSpawnOptions extends SpawnOptions {}

export interface ProcessProvider {
  spawn(command: string, args: string[], options?: ProcessSpawnOptions): ProcessHandle;
}

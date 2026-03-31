import type { SpawnOptions } from 'node:child_process';

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

export interface ProcessProvider {
  spawn(command: string, args: string[], options?: SpawnOptions): ProcessHandle;
}

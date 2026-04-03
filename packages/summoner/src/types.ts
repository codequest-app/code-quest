import type { SpawnOptions } from 'node:child_process';
import type { ClientMessage, ProviderClientConfig } from '@code-quest/shared';

export type { ClientMessage };

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

// --- AdapterOutput: result of transforming a protocol message ---

export interface AdapterOutput {
  messages: ClientMessage[];
  controlResponses: ControlResponseEvent[];
  serverActions: never[];
}

// --- ParseResult: generic parse output ---

export interface ParseOk<E = unknown> {
  status: 'ok';
  raw: string;
  event: E;
}

export interface ParseSkip {
  status: 'skip';
  raw: string;
  reason: string;
}

export interface ParseUnknown {
  status: 'unknown';
  raw: string;
  type: string;
  data: unknown;
}

export interface ParseError {
  status: 'error';
  raw: string;
  error: unknown;
}

export type ParseResult<E = unknown> = ParseOk<E> | ParseSkip | ParseUnknown | ParseError;

// --- ProviderAdapter: contract between ProcessRunner and CLI providers ---

export interface ProviderAdapter<E = unknown, L = unknown> {
  readonly command: string;
  readonly clientConfig: ProviderClientConfig;

  buildArgs(options?: L): string[];
  parseLine(line: string): ParseResult<E>;
  transform(message: E): AdapterOutput;
  formatMessage(text: string): string;
  formatRequest(
    event: string,
    payload: Record<string, unknown>,
  ): { subtype: string; input: Record<string, unknown> };
  formatControlRequest(
    subtype: string,
    input?: Record<string, unknown>,
    requestId?: string,
  ): string;
  formatControlResponse(requestId: string, response: Record<string, unknown>): string;
  extractRespondedRequestIds(rawEntries: Array<{ direction: string; raw: string }>): Set<string>;
}

import type { ProviderClientConfig, SocketEvent } from '@code-quest/shared';
import type { ZodError } from 'zod';
import type { ControlResponseEvent } from '../types.ts';
import type { ProtocolEvent } from './claude-schemas.ts';

export type { SocketEvent };

// --- ParseResult: output of parseLine ---

export interface ParseOk {
  status: 'ok';
  raw: string;
  event: ProtocolEvent;
}

export interface ParseSkip {
  status: 'skip';
  raw: string;
  reason: 'empty' | 'keep_alive' | 'invalid_json' | 'no_type';
}

export interface ParseUnknown {
  status: 'unknown';
  raw: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ParseError {
  status: 'error';
  raw: string;
  error: ZodError;
}

export type ParseResult = ParseOk | ParseSkip | ParseUnknown | ParseError;

// --- LaunchOptions: CLI launch parameters (provider-agnostic) ---

export interface LaunchOptions {
  resumeSessionId?: string;
  continueSession?: boolean;
  forkSession?: boolean;
  sessionId?: string;
  resumeSessionAt?: string;
  noSessionPersistence?: boolean;
  model?: string;
  fallbackModel?: string;
  thinking?: 'adaptive' | 'disabled' | number;
  effort?: 'high' | 'medium' | 'low' | 'max';
  maxTurns?: number;
  maxBudgetUsd?: number;
  agent?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  tools?: string[];
  mcpConfig?: string | Record<string, unknown>;
  settingSources?: string[];
  strictMcpConfig?: boolean;
  allowDangerouslySkipPermissions?: boolean;
  permissionMode?: string;
  proactive?: boolean;
  assistant?: boolean;
  jsonSchema?: Record<string, unknown>;
  betas?: string[];
  debug?: boolean;
  debugFile?: string;
  debugToStderr?: boolean;
  addDirs?: string[];
  pluginDirs?: string[];
  taskBudget?: { total: number };
  channels?: string[];
  claudeInChromeMcp?: boolean;
}

// --- AutoResponse: provider knows CLI expects an immediate reply ---

// --- AdapterOutput: result of transforming a ProtocolEvent ---

export interface AdapterOutput {
  /** Named socket events ready for emit */
  events: SocketEvent[];
  controlResponses: ControlResponseEvent[];
  serverActions: ServerAction[];
}

// --- ProviderAdapter: contract between ProcessRunner and CLI providers ---

export interface ProviderAdapter {
  readonly command: string;
  readonly clientConfig: ProviderClientConfig;

  buildArgs(options?: LaunchOptions): string[];

  parseLine(line: string): ParseResult;

  transform(event: ProtocolEvent): AdapterOutput;

  formatMessage(text: string): string;

  formatControlRequest(
    subtype: string,
    input?: Record<string, unknown>,
    requestId?: string,
  ): string;

  formatControlResponse(requestId: string, response: Record<string, unknown>): string;

  extractRespondedRequestIds(rawEntries: Array<{ direction: string; raw: string }>): Set<string>;
}

// --- ServerAction: adapter tells server what to do ---

export interface AutoRespondAction {
  action: 'auto_respond';
  requestId: string;
  subtype: string;
  response: Record<string, unknown>;
  input?: unknown;
}

export interface ReadDiffAction {
  action: 'read_diff';
  requestId: string;
  originalPath: string;
  newPath: string;
}

export interface ForwardToClientAction {
  action: 'forward_to_client';
  requestId: string;
  subtype: string;
  toolName?: string;
  toolUseId?: string;
  input?: unknown;
  suggestions?: unknown[];
  callbackId?: string;
}

export type ServerAction = AutoRespondAction | ReadDiffAction | ForwardToClientAction;

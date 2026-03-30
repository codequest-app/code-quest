import type { ProviderClientConfig, SocketEvent } from '@code-quest/shared';
import type { ZodError } from 'zod';
import type { ControlResponseEvent } from '../types.ts';
import type { ProtocolEvent } from './claude-schemas.ts';
import type { ServerAction } from './server-action.ts';

export type { SocketEvent };

// --- ParseResult: output of parseLine ---

export type ParseResult =
  | { status: 'ok'; raw: string; event: ProtocolEvent }
  | { status: 'skip'; raw: string; reason: 'empty' | 'keep_alive' | 'invalid_json' | 'no_type' }
  | { status: 'unknown'; raw: string; type: string; data: Record<string, unknown> }
  | { status: 'error'; raw: string; error: ZodError };

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

export interface AutoResponse {
  requestId: string;
  subtype: string;
  response: Record<string, unknown>;
  input?: unknown;
}

// --- AdapterOutput: result of transforming a ProtocolEvent ---

export interface AdapterOutput {
  /** Named socket events ready for emit */
  events: SocketEvent[];
  autoResponses: AutoResponse[];
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

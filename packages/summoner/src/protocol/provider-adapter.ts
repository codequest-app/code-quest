// Re-export from types.ts for backward compatibility during migration
export type {
  AdapterOutput,
  AutoRespondAction,
  ForwardToClientAction,
  ParseError,
  ParseOk,
  ParseResult,
  ParseSkip,
  ParseUnknown,
  ProviderAdapter,
  ReadDiffAction,
  ServerAction,
  SocketEvent,
} from '../types.ts';

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

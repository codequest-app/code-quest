import type { z } from 'zod';
import type {
  chatProviderSchema,
  chatStatsSchema,
  chatStreamEventSchema,
  orchestratorStatusSchema,
  subTaskSchema,
  systemCapabilitiesSchema,
  workerInfoSchema,
} from './schemas.ts';

export type ChatProvider = z.infer<typeof chatProviderSchema>;
export type ChatStats = z.infer<typeof chatStatsSchema>;
export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;
export type OrchestratorStatus = z.infer<typeof orchestratorStatusSchema>;
export type SubTask = z.infer<typeof subTaskSchema>;
export type WorkerInfo = z.infer<typeof workerInfoSchema>;
export type SystemCapabilities = z.infer<typeof systemCapabilitiesSchema>;

export interface ControlResponse {
  requestId: string;
  success: boolean;
  response?: {
    models?: Array<{
      value: string;
      displayName: string;
      description: string;
      supportsEffort?: boolean;
    }>;
    account?: { email: string; subscriptionType: string };
    commands?: Array<{ name: string; description: string }>;
    outputStyle?: string;
    availableOutputStyles?: string[];
    pid?: number;
    permissionMode?: string;
    maxThinkingTokens?: number;
    mcpServers?: Array<{ name: string; status: string; error?: string; scope?: string }>;
  };
  error?: string;
}

export interface ControlRequest {
  requestId: string;
  subtype: string;
  toolName?: string;
  input?: unknown;
  callbackId?: string;
  toolUseId?: string;
}

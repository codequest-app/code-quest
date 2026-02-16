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

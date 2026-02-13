import { z } from 'zod';
import { chatProviderSchema, terminalOptionsSchema } from '../shared/schemas.ts';

const sessionIdSchema = z.string().min(1);

// Terminal
export const terminalCreateSchema = terminalOptionsSchema.optional();
export const terminalWriteSchema = z.object({
  sessionId: sessionIdSchema,
  data: z.string(),
});
export const terminalResizeSchema = z.object({
  sessionId: sessionIdSchema,
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});
export const terminalKillSchema = z.object({ sessionId: sessionIdSchema });

// Chat
export const chatCreateSchema = z.object({
  provider: chatProviderSchema,
  cwd: z.string().optional(),
});
export const chatSendSchema = z.object({
  sessionId: sessionIdSchema,
  message: z.string().min(1),
});
export const chatAbortSchema = z.object({ sessionId: sessionIdSchema });
export const chatAllowToolSchema = z.object({
  sessionId: sessionIdSchema,
  toolName: z.string().min(1),
});
export const chatKillSchema = z.object({ sessionId: sessionIdSchema });

// Orchestrator
export const subTaskSchema = z.object({
  description: z.string().min(1),
  provider: chatProviderSchema,
});
export const orchestratorCreateSchema = z.object({
  provider: chatProviderSchema,
});
export const orchestratorDispatchSchema = z.object({
  orchId: sessionIdSchema,
  tasks: z.array(subTaskSchema).min(1),
});
export const orchestratorSynthesizeSchema = z.object({
  orchId: sessionIdSchema,
});
export const orchestratorAbortSchema = z.object({ orchId: sessionIdSchema });
export const orchestratorKillSchema = z.object({ orchId: sessionIdSchema });

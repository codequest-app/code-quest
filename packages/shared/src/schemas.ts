import { z } from 'zod';

export const chatProviderSchema = z.enum(['claude', 'gemini']);

export const terminalOptionsSchema = z.object({
  shell: z.string().optional(),
  cwd: z.string().optional(),
  cols: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

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
  dependsOn: z.array(z.number().int().nonnegative()).optional(),
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

// Shared domain schemas
export const chatStatsSchema = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

export const chatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('init'), data: z.object({ sessionId: z.string() }) }),
  z.object({ type: z.literal('text'), data: z.object({ content: z.string() }) }),
  z.object({ type: z.literal('thinking'), data: z.object({ content: z.string() }) }),
  z.object({
    type: z.literal('tool_use'),
    data: z.object({ id: z.string(), name: z.string(), input: z.unknown() }),
  }),
  z.object({
    type: z.literal('tool_result'),
    data: z.object({ name: z.string(), output: z.string() }),
  }),
  z.object({ type: z.literal('result'), data: z.object({ stats: chatStatsSchema }) }),
  z.object({ type: z.literal('error'), data: z.object({ message: z.string() }) }),
  z.object({
    type: z.literal('permission_request'),
    data: z.object({ toolName: z.string(), description: z.string() }),
  }),
]);

export const orchestratorStatusSchema = z.enum([
  'idle',
  'dispatching',
  'workers-running',
  'merging',
  'workers-complete',
  'synthesizing',
  'complete',
  'error',
]);

export const workerInfoSchema = z.object({
  id: z.string(),
  task: subTaskSchema,
  status: z.enum(['pending', 'running', 'complete', 'error']),
  result: z.string().optional(),
  stats: chatStatsSchema.optional(),
  error: z.string().optional(),
  wave: z.number().optional(),
});

export const systemCapabilitiesSchema = z.object({
  worktree: z.boolean(),
});

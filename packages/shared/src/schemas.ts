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
export const orchestratorRetryWorkerSchema = z.object({
  orchId: sessionIdSchema,
  workerId: z.string().min(1),
});
export const orchestratorSkipWorkerSchema = z.object({
  orchId: sessionIdSchema,
  workerId: z.string().min(1),
});

// Shared domain schemas
export const chatStatsSchema = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

export const chatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('spawn'),
    data: z.object({
      command: z.string(),
      args: z.array(z.string()),
      cwd: z.string(),
      mode: z.string(),
    }),
  }),
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
  z.object({
    type: z.literal('control_response'),
    data: z.object({
      requestId: z.string(),
      success: z.boolean(),
      response: z
        .object({
          models: z
            .array(
              z.object({
                value: z.string(),
                displayName: z.string(),
                description: z.string(),
                supportsEffort: z.boolean().optional(),
              }),
            )
            .optional(),
          account: z
            .object({
              email: z.string(),
              subscriptionType: z.string(),
            })
            .optional(),
          commands: z
            .array(
              z.object({
                name: z.string(),
                description: z.string(),
              }),
            )
            .optional(),
          outputStyle: z.string().optional(),
          availableOutputStyles: z.array(z.string()).optional(),
          pid: z.number().optional(),
        })
        .optional(),
      error: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('control_request'),
    data: z.object({
      requestId: z.string(),
      subtype: z.string(),
      toolName: z.string().optional(),
      input: z.unknown().optional(),
      callbackId: z.string().optional(),
      toolUseId: z.string().optional(),
    }),
  }),
]);

// Control protocol
export const chatControlSchema = z.object({
  sessionId: z.string().min(1),
  subtype: z.string().min(1),
  params: z.record(z.string(), z.unknown()).optional(),
});
export const chatControlRespondSchema = z.object({
  sessionId: z.string().min(1),
  requestId: z.string().min(1),
  response: z.record(z.string(), z.unknown()),
});

// Tavern
export const tavernMessageSchema = z.string().min(1).max(500);

export const orchestratorStatusSchema = z.enum([
  'idle',
  'dispatching',
  'workers-running',
  'merging',
  'workers-paused',
  'workers-complete',
  'synthesizing',
  'complete',
  'error',
]);

export const workerInfoSchema = z.object({
  id: z.string(),
  task: subTaskSchema,
  status: z.enum(['pending', 'running', 'complete', 'error', 'skipped']),
  result: z.string().optional(),
  stats: chatStatsSchema.optional(),
  error: z.string().optional(),
  wave: z.number().optional(),
});

export const systemCapabilitiesSchema = z.object({
  worktree: z.boolean(),
});

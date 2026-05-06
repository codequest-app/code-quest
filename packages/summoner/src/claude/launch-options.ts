import { z } from 'zod';

/** Claude CLI launch parameters — all fields map to CLI flags. */
const launchOptionsSchema: z.ZodObject<{
  resumeSessionId: z.ZodOptional<z.ZodString>;
  continueSession: z.ZodOptional<z.ZodBoolean>;
  forkSession: z.ZodOptional<z.ZodBoolean>;
  sessionId: z.ZodOptional<z.ZodString>;
  resumeSessionAt: z.ZodOptional<z.ZodString>;
  noSessionPersistence: z.ZodOptional<z.ZodBoolean>;
  model: z.ZodOptional<z.ZodString>;
  fallbackModel: z.ZodOptional<z.ZodString>;
  thinking: z.ZodOptional<
    z.ZodUnion<readonly [z.ZodEnum<{ adaptive: 'adaptive'; disabled: 'disabled' }>, z.ZodNumber]>
  >;
  thinkingDisplay: z.ZodOptional<z.ZodEnum<{ summarized: 'summarized'; omitted: 'omitted' }>>;
  effort: z.ZodOptional<z.ZodEnum<{ high: 'high'; medium: 'medium'; low: 'low'; max: 'max' }>>;
  maxTurns: z.ZodOptional<z.ZodNumber>;
  maxBudgetUsd: z.ZodOptional<z.ZodNumber>;
  agent: z.ZodOptional<z.ZodString>;
  allowedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
  disallowedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
  tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
  mcpConfig: z.ZodOptional<
    z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>
  >;
  settingSources: z.ZodOptional<z.ZodArray<z.ZodString>>;
  strictMcpConfig: z.ZodOptional<z.ZodBoolean>;
  allowDangerouslySkipPermissions: z.ZodOptional<z.ZodBoolean>;
  permissionMode: z.ZodOptional<z.ZodString>;
  proactive: z.ZodOptional<z.ZodBoolean>;
  assistant: z.ZodOptional<z.ZodBoolean>;
  jsonSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  betas: z.ZodOptional<z.ZodArray<z.ZodString>>;
  debug: z.ZodOptional<z.ZodBoolean>;
  debugFile: z.ZodOptional<z.ZodString>;
  debugToStderr: z.ZodOptional<z.ZodBoolean>;
  addDirs: z.ZodOptional<z.ZodArray<z.ZodString>>;
  pluginDirs: z.ZodOptional<z.ZodArray<z.ZodString>>;
  taskBudget: z.ZodOptional<z.ZodObject<{ total: z.ZodNumber }>>;
  channels: z.ZodOptional<z.ZodArray<z.ZodString>>;
  claudeInChromeMcp: z.ZodOptional<z.ZodBoolean>;
}> = z.object({
  resumeSessionId: z.string().optional(),
  continueSession: z.boolean().optional(),
  forkSession: z.boolean().optional(),
  sessionId: z.string().optional(),
  resumeSessionAt: z.string().optional(),
  noSessionPersistence: z.boolean().optional(),
  model: z.string().optional(),
  fallbackModel: z.string().optional(),
  thinking: z.union([z.enum(['adaptive', 'disabled']), z.number()]).optional(),
  thinkingDisplay: z.enum(['summarized', 'omitted']).optional(),
  effort: z.enum(['high', 'medium', 'low', 'max']).optional(),
  maxTurns: z.number().optional(),
  maxBudgetUsd: z.number().optional(),
  agent: z.string().optional(),
  allowedTools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  mcpConfig: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  settingSources: z.array(z.string()).optional(),
  strictMcpConfig: z.boolean().optional(),
  allowDangerouslySkipPermissions: z.boolean().optional(),
  permissionMode: z.string().optional(),
  proactive: z.boolean().optional(),
  assistant: z.boolean().optional(),
  jsonSchema: z.record(z.string(), z.unknown()).optional(),
  betas: z.array(z.string()).optional(),
  debug: z.boolean().optional(),
  debugFile: z.string().optional(),
  debugToStderr: z.boolean().optional(),
  addDirs: z.array(z.string()).optional(),
  pluginDirs: z.array(z.string()).optional(),
  taskBudget: z.object({ total: z.number() }).optional(),
  channels: z.array(z.string()).optional(),
  claudeInChromeMcp: z.boolean().optional(),
});

export type LaunchOptions = z.infer<typeof launchOptionsSchema>;

import { z } from 'zod';
import { tokenUsageSchema } from './system.ts';

export const taskTypeSchema: z.ZodEnum<{
  local_agent: 'local_agent';
  local_bash: 'local_bash';
  subagent: 'subagent';
}> = z.enum(['local_agent', 'local_bash', 'subagent']);
export type TaskType = z.infer<typeof taskTypeSchema>;

export const taskStatusSchema: z.ZodEnum<{
  running: 'running';
  completed: 'completed';
  failed: 'failed';
}> = z.enum(['running', 'completed', 'failed']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskStartedPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    description: z.ZodString;
    taskType: z.ZodOptional<
      z.ZodEnum<{ local_agent: 'local_agent'; local_bash: 'local_bash'; subagent: 'subagent' }>
    >;
    toolUseId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  description: z.string(),
  taskType: taskTypeSchema.optional(),
  toolUseId: z.string().optional(),
});
export type TaskStartedPayload = z.infer<typeof taskStartedPayloadSchema>;

export const taskProgressPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    taskId: z.ZodString;
    toolUseId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    lastToolName: z.ZodOptional<z.ZodString>;
    usage: z.ZodOptional<typeof tokenUsageSchema>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  taskId: z.string(),
  toolUseId: z.string().optional(),
  description: z.string().optional(),
  lastToolName: z.string().optional(),
  usage: tokenUsageSchema.optional(),
});
export type TaskProgressPayload = z.infer<typeof taskProgressPayloadSchema>;

export const taskNotificationPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    taskId: z.ZodString;
    toolUseId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    outputFile: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    usage: z.ZodOptional<typeof tokenUsageSchema>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  taskId: z.string(),
  toolUseId: z.string().optional(),
  status: z.string().optional(),
  outputFile: z.string().optional(),
  summary: z.string().optional(),
  usage: tokenUsageSchema.optional(),
});
export type TaskNotificationPayload = z.infer<typeof taskNotificationPayloadSchema>;

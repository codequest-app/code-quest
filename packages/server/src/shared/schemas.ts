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

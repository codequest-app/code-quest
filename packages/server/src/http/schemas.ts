import { z } from 'zod';

/**
 * Request schema for creating a terminal session
 */
export const createTerminalRequestSchema = z
  .object({
    shell: z.string().optional(),
    cwd: z.string().optional(),
    cols: z.number().int().positive().optional(),
    rows: z.number().int().positive().optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string(), z.string()).optional(),
  })
  .strict();

/**
 * Response schema for errors
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

/**
 * Response schema for health check
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

/**
 * Response schema for creating a terminal
 */
export const createTerminalResponseSchema = z.object({
  id: z.string(),
  pid: z.number(),
});

/**
 * Response schema for terminal info
 */
export const terminalInfoResponseSchema = z.object({
  id: z.string(),
  pid: z.number(),
  isAlive: z.boolean(),
});

/**
 * Response schema for terminal list
 */
export const terminalListResponseSchema = z.object({
  sessions: z.array(terminalInfoResponseSchema),
});

/**
 * Inferred types from schemas
 */
export type CreateTerminalRequest = z.infer<typeof createTerminalRequestSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type CreateTerminalResponse = z.infer<typeof createTerminalResponseSchema>;
export type TerminalInfoResponse = z.infer<typeof terminalInfoResponseSchema>;
export type TerminalListResponse = z.infer<typeof terminalListResponseSchema>;

import { terminalOptionsSchema } from '@code-quest/shared';

/**
 * Request schema for creating a terminal session
 */
export const createTerminalRequestSchema = terminalOptionsSchema.strict();

export type {
  CreateTerminalResponse,
  ErrorResponse,
  HealthResponse,
  TerminalIdParam,
  TerminalInfoResponse,
  TerminalListResponse,
} from '@code-quest/shared';
/**
 * Response schemas — re-exported from shared
 */
export {
  createTerminalResponseSchema,
  errorResponseSchema,
  healthResponseSchema,
  terminalIdParamSchema,
  terminalInfoResponseSchema,
  terminalListResponseSchema,
} from '@code-quest/shared';

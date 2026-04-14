/** Canonical error codes used across socket RPC responses. */
export const ERROR_CODES = {
  SESSION_NOT_FOUND: 'session_not_found',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

import type { ClientMessage } from '@code-quest/shared';
import type { z } from 'zod';
import type { authStatusSchema, authUrlSchema } from '../schemas.ts';

type AuthStatusMessage = z.infer<typeof authStatusSchema>;
type AuthUrlMessage = z.infer<typeof authUrlSchema>;

export function transformAuthStatus(raw: AuthStatusMessage): ClientMessage {
  return {
    name: 'notification:auth_status',
    payload: {
      status: raw.isAuthenticating ? 'authenticating' : 'authenticated',
      output: Array.isArray(raw.output) ? raw.output.join('\n') : undefined,
      account: raw.account,
    },
  };
}

export function transformAuthUrl(raw: AuthUrlMessage): ClientMessage {
  return {
    name: 'notification:auth_url',
    payload: { url: raw.url, method: raw.method },
  };
}

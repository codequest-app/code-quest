import type { Authenticator } from '../authenticator.ts';
import type { Middleware } from '../ws-transport.ts';

export function auth(authenticator: Authenticator): Middleware {
  return async (context, next) => {
    // Server-only middleware: client-side connect() has no req, skip silently.
    if (!context.req) return;
    try {
      const result = await authenticator.authenticate(context.req);
      if (!result) {
        console.warn('[auth] rejected: authenticate returned null');
        return;
      }
      context.auth = result;
      await next();
    } catch (err) {
      console.warn('auth failed', err);
    }
  };
}

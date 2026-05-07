import type { Middleware } from '../ws-transport.ts';

export function bearerToken(token: string): Middleware {
  return async (ctx, next) => {
    ctx.headers = {
      ...ctx.headers,
      Authorization: `Bearer ${token}`,
    };
    await next();
  };
}

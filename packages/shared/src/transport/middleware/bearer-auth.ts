import { timingSafeEqual } from 'node:crypto';
import type { Middleware } from '../ws-transport.ts';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export const PEER_TYPE_SUMMONER = 'summoner';

export function bearerAuth(expectedToken: string): Middleware {
  const expected = `Bearer ${expectedToken}`;
  return async (context, next) => {
    const authHeader = context.req?.headers.authorization;
    if (!authHeader || !safeCompare(authHeader, expected)) {
      console.debug('[bearer-auth] rejected: invalid or missing token');
      return;
    }
    context.peerType = PEER_TYPE_SUMMONER;
    await next();
  };
}

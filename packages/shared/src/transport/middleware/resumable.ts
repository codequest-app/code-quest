import type { IncomingMessage } from 'node:http';
import { z } from 'zod';
import { ResumableSocket } from '../resumable-socket.ts';
import { RESUME_EVENT } from '../rpc-channel.ts';
import type { TypedSocket } from '../types.ts';
import type { Middleware } from '../ws-transport.ts';

const resumePayloadSchema = z.object({ lastSeq: z.number() }).optional();

export interface ResumableOptions {
  bufferSize?: number;
  ttlMs?: number;
}

const DEFAULT_BUFFER_SIZE = 500;
const DEFAULT_TTL_MS = 300_000;
const STATE_REFRESH_REQUIRED_EVENT = 'state:refresh_required';

function extractSessionKey(req?: IncomingMessage): string | undefined {
  if (!req?.url) return undefined;
  let url: URL;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return undefined;
  }
  const key = url.searchParams.get('sessionKey');
  return key && key.length > 0 ? key : undefined;
}

export function resumable(opts?: ResumableOptions): Middleware {
  const bufferSize = opts?.bufferSize ?? DEFAULT_BUFFER_SIZE;
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const registry = new Map<string, ResumableSocket>();
  const ttlTimers = new Map<string, ReturnType<typeof setTimeout>>();

  return async (context, next) => {
    const sessionKey = extractSessionKey(context.req);

    context.transformSocket = (typed: TypedSocket): TypedSocket => {
      let rs: ResumableSocket;

      const existing = sessionKey ? registry.get(sessionKey) : undefined;
      if (sessionKey && existing) {
        rs = existing;
        rs.rebind(typed);
        const timer = ttlTimers.get(sessionKey);
        if (timer) {
          clearTimeout(timer);
          ttlTimers.delete(sessionKey);
        }
      } else {
        rs = new ResumableSocket(typed, { bufferSize });
        if (sessionKey) registry.set(sessionKey, rs);
      }

      typed.on(RESUME_EVENT, (...args: unknown[]) => {
        const parsed = resumePayloadSchema.safeParse(args[0]);
        const lastSeq = parsed.success ? (parsed.data?.lastSeq ?? 0) : 0;
        const result = rs.resume(lastSeq);
        if (result.kind === 'gap') {
          rs.emit(STATE_REFRESH_REQUIRED_EVENT, {});
        }
      });

      return rs;
    };

    await next();
    await context.terminate?.();

    if (sessionKey) {
      const timer = setTimeout(() => {
        registry.delete(sessionKey);
        ttlTimers.delete(sessionKey);
      }, ttlMs);
      ttlTimers.set(sessionKey, timer);
    }
  };
}

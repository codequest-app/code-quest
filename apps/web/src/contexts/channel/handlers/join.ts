import { sessionJoinResponseSchema } from '@code-quest/shared';

export function parseJoinResponse(
  raw: unknown,
): { ok: true; state: string } | { ok: false; error: string } {
  const parsed = sessionJoinResponseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Failed to join session' };
  if (!parsed.data.ok) return { ok: false, error: parsed.data.error };
  return { ok: true, state: parsed.data.data.state };
}

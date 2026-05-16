import { isRecord } from '@code-quest/utils';

export { isRecord };

export function asRecord(v: unknown): Record<string, unknown> | undefined {
  return isRecord(v) ? v : undefined;
}

/** Return v if it's a string, else fallback. Use undefined to represent missing. */
export function asString<T extends string | undefined>(v: unknown, fallback: T): string | T {
  return typeof v === 'string' ? v : fallback;
}

/** Extract the `code` property from a NodeJS-style error (e.g. ENOENT, ENOSPC). */
export function errorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null || !('code' in err)) return undefined;
  const { code } = err as { code: unknown };
  return typeof code === 'string' ? code : undefined;
}

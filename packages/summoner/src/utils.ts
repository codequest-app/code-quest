import { isRecord } from '@code-quest/shared';

export { isRecord };

export function asRecord(v: unknown): Record<string, unknown> | undefined {
  return isRecord(v) ? v : undefined;
}

/** Return v if it's a string, else fallback. Use undefined to represent missing. */
export function asString<T extends string | undefined>(v: unknown, fallback: T): string | T {
  return typeof v === 'string' ? v : fallback;
}

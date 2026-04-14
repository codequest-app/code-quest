export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function asRecord(v: unknown): Record<string, unknown> | undefined {
  return isRecord(v) ? v : undefined;
}

/** Return v if it's a string, else fallback. Use undefined to represent missing. */
export function asString<T extends string | undefined>(v: unknown, fallback: T): string | T {
  return typeof v === 'string' ? v : fallback;
}

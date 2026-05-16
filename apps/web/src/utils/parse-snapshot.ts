interface Schema<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false };
}

export function parseSnapshot<T>(payload: unknown, schema: Schema<T>): T | null {
  if (typeof payload !== 'object' || payload === null || !('snapshot' in payload)) return null;
  const parsed = schema.safeParse((payload as Record<string, unknown>).snapshot);
  return parsed.success ? parsed.data : null;
}

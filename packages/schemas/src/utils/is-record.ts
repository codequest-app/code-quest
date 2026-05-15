/** Runtime guard: is `v` a non-null object (plain record shape)? */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

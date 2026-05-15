export const PERMISSION_MODES = [
  'normal',
  'plan',
  'acceptEdits',
  'bypassPermissions',
  'auto',
] as const;

export type PermissionMode = (typeof PERMISSION_MODES)[number];

/** Narrow an untyped wire value to `PermissionMode`, falling back to `'normal'`
 *  when the CLI emits a mode we don't recognize. Used at UI boundaries that
 *  need a definite mode (e.g., CSS-var dispatch on `data-mode`). The wire
 *  schema stays `z.string().optional()` so forward-compatibility with new
 *  provider modes is preserved — only render-time needs the narrow set. */
export function toPermissionMode(value: string | null | undefined): PermissionMode {
  if (value && (PERMISSION_MODES as readonly string[]).includes(value)) {
    return value as PermissionMode;
  }
  return 'normal';
}

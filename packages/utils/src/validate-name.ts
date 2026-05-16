const PATH_TRAVERSAL_RE = /\.\./;

export function validateName(
  name: string,
  maxLength: number,
  pattern: RegExp,
  patternError: string,
): string | null {
  if (!name) return 'Name is required';
  if (name.length > maxLength)
    return `Name must be ${maxLength} characters or fewer (got ${name.length})`;
  if (!pattern.test(name)) return patternError;
  if (PATH_TRAVERSAL_RE.test(name)) return 'Name must not contain ".." path segments';
  if (name.endsWith('.') || name.endsWith('.lock')) return 'Name must not end with "." or ".lock"';
  return null;
}

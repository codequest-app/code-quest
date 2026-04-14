const MAX_NAME_LENGTH = 100;
const VALID_NAME_RE = /^[a-zA-Z0-9._-]+$/;
const PATH_TRAVERSAL_RE = /\.\./;

/**
 * Validate a git worktree name. Returns an error string if invalid, or `null` if ok.
 *
 * Single source of truth for both client (dialog validation) and server
 * (pre-flight + `git worktree add` safety).
 */
export function validateWorktreeName(name: string): string | null {
  if (!name) return 'Name is required';
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer (got ${name.length})`;
  }
  if (!VALID_NAME_RE.test(name)) {
    return 'Only letters, numbers, dots, hyphens, and underscores allowed';
  }
  if (PATH_TRAVERSAL_RE.test(name)) {
    return 'Name must not contain ".." path segments';
  }
  if (name.endsWith('.') || name.endsWith('.lock')) {
    return 'Name must not end with "." or ".lock"';
  }
  return null;
}

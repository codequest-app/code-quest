const MAX_NAME_LENGTH = 255;
const VALID_NAME_RE = /^[\w./-]+$/;
const PATH_TRAVERSAL_RE = /\.\./;

/**
 * Validate a git branch name. Returns an error string if invalid, or `null` if ok.
 *
 * Allows `/` (e.g. `feature/foo`) unlike worktree names.
 */
export function validateBranchName(name: string): string | null {
  if (!name) return 'Name is required';
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer (got ${name.length})`;
  }
  if (!VALID_NAME_RE.test(name)) {
    return 'Only letters, numbers, dots, hyphens, underscores, and slashes allowed';
  }
  if (PATH_TRAVERSAL_RE.test(name)) {
    return 'Name must not contain ".." path segments';
  }
  if (name.endsWith('.') || name.endsWith('.lock')) {
    return 'Name must not end with "." or ".lock"';
  }
  return null;
}

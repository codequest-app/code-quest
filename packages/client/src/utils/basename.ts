/** Last path segment, or the input itself when no slash. Matches POSIX semantics. */
export function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

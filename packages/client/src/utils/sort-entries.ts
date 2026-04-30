export function sortEntriesDirsFirst<T extends { name: string; type?: string; kind?: string }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    const aIsDir = a.type === 'directory' || a.kind === 'directory';
    const bIsDir = b.type === 'directory' || b.kind === 'directory';
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

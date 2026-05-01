export function nextDuplicateName(siblings: readonly string[], original: string): string {
  const set = new Set(siblings);
  const dot = original.lastIndexOf('.');
  const base = dot < 0 ? original : original.slice(0, dot);
  const ext = dot < 0 ? '' : original.slice(dot);
  const join = (b: string) => `${b}${ext}`;

  const first = join(`${base} copy`);
  if (!set.has(first)) return first;
  for (let n = 2; n < 1000; n++) {
    const candidate = join(`${base} copy ${n}`);
    if (!set.has(candidate)) return candidate;
  }
  return join(`${base} copy ${Date.now()}`);
}

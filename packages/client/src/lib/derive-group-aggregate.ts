export function deriveGroupAggregate(
  items: ReadonlyArray<{ on: boolean }>,
): 'all' | 'partial' | 'none' {
  const onCount = items.filter((i) => i.on).length;
  if (onCount === 0) return 'none';
  if (onCount === items.length) return 'all';
  return 'partial';
}

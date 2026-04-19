/** Collapse a set of toggleable items into a tri-state aggregate.
 *  Shared by renderMenuTrailing / renderPaletteTrailing / FeatureRow so the
 *  same derivation can't drift. */
export function deriveGroupAggregate(
  items: ReadonlyArray<{ on: boolean }>,
): 'all' | 'partial' | 'none' {
  const onCount = items.filter((i) => i.on).length;
  if (onCount === 0) return 'none';
  if (onCount === items.length) return 'all';
  return 'partial';
}

import type { Feature } from '../../lib/feature';
import { cn } from '../../utils/cn';
import { FeatureRow } from './FeatureRow';

export interface PaletteCommandListProps {
  features: Feature[];
  query: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  onExecute?: (feature: Feature) => void;
  className?: string;
}

/** Sort by explicit `order` first; features without `order` fall to the end
 *  and use label as a deterministic tiebreak (alphabetical) so same-order
 *  features don't depend on insertion order. */
const byOrder = (a: Feature, b: Feature) => {
  const diff = (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY);
  return diff !== 0 ? diff : a.label.localeCompare(b.label);
};

function groupAndFilter(features: Feature[], query: string) {
  const q = query.trim().toLowerCase();
  const keep = q ? features.filter((f) => f.label.toLowerCase().includes(q)) : features;
  const order: string[] = [];
  const bucket = new Map<string, Feature[]>();
  for (const f of keep) {
    const existing = bucket.get(f.section);
    if (existing) {
      existing.push(f);
    } else {
      bucket.set(f.section, [f]);
      order.push(f.section);
    }
  }
  return order.map((label) => ({
    label,
    features: [...(bucket.get(label) ?? [])].sort(byOrder),
  }));
}

export function PaletteCommandList({
  features,
  query,
  activeId,
  onActiveChange,
  onExecute,
  className,
}: PaletteCommandListProps) {
  const groups = groupAndFilter(features, query);
  if (groups.length === 0) return null;

  return (
    <div className={cn(className)}>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3
            style={{
              padding: '6px 16px 2px',
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#4a4a4e',
              margin: 0,
            }}
          >
            {group.label}
          </h3>
          {group.features.map((f) => (
            <FeatureRow
              key={f.id}
              feature={f}
              isActive={f.id === activeId}
              onActiveChange={onActiveChange}
              onExecute={onExecute}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

import { isRecord } from '@code-quest/utils';

export function getEventType(evt: unknown): string | undefined {
  if (!isRecord(evt)) return undefined;
  return typeof evt.type === 'string' ? evt.type : undefined;
}

function isDeltaType(type: string): boolean {
  return type.toLowerCase().includes('delta');
}

export function discoverNewTypes(events: unknown[], seenTypes: Set<string>): string[] {
  const newTypes: string[] = [];
  for (const evt of events) {
    const t = getEventType(evt);
    if (t && !seenTypes.has(t)) {
      seenTypes.add(t);
      newTypes.push(t);
    }
  }
  return newTypes;
}

export function addVisibleTypes(current: Set<string>, newTypes: string[]): Set<string> {
  const next = new Set(current);
  for (const t of newTypes) {
    if (!isDeltaType(t)) next.add(t);
  }
  return next;
}

interface FilterEntry {
  type: string;
  count: number;
}

export function buildFilterEntries(events: unknown[]): FilterEntry[] {
  const counts = new Map<string, number>();
  for (const evt of events) {
    const t = getEventType(evt);
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function filterEvents(
  events: unknown[],
  visibleTypes: Set<string>,
  searchText: string,
): unknown[] {
  const search = searchText.toLowerCase();
  return events.filter((evt) => {
    const t = getEventType(evt);
    if (t && !visibleTypes.has(t)) return false;
    if (search && !JSON.stringify(evt).toLowerCase().includes(search)) return false;
    return true;
  });
}

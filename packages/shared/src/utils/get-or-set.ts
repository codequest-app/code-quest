export function getOrSet<K, V>(map: Map<K, Promise<V>>, key: K, fn: () => Promise<V>): Promise<V> {
  const existing = map.get(key);
  if (existing) return existing;
  const p = fn().finally(() => map.delete(key));
  map.set(key, p);
  return p;
}

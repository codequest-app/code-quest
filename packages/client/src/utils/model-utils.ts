import type { ModelInfo, ProviderClientConfig } from '@code-quest/shared';

export interface ModelDisplayInfo {
  displayName: string;
  subLabel: string;
}

type ModelDisplayMapEntry = ProviderClientConfig['modelDisplayMap'][number];

function findInMap(id: string, map: ModelDisplayMapEntry[]): ModelDisplayMapEntry | undefined {
  const lower = id.toLowerCase();
  return map.find((entry) => lower.includes(entry.pattern));
}

/** Short display name for a model ID. Uses modelDisplayMap, falls back to raw ID. */
export function shortModelName(id: string, modelDisplayMap: ModelDisplayMapEntry[] = []): string {
  return findInMap(id, modelDisplayMap)?.displayName ?? id;
}

/** Display info for model picker. Uses modelDisplayMap for matching. */
export function getModelDisplayInfo(
  id: string,
  defaultModel?: string | null,
  modelDisplayMap: ModelDisplayMapEntry[] = [],
  defaultModelDescription = 'Most capable for complex work',
): ModelDisplayInfo {
  if (id === '') {
    const defaultEntry = defaultModel ? findInMap(defaultModel, modelDisplayMap) : undefined;
    const label = defaultEntry?.displayName ?? defaultModel ?? '';
    return {
      displayName: 'Default (recommended)',
      subLabel: label ? `${label} · ${defaultModelDescription}` : defaultModelDescription,
    };
  }
  const entry = findInMap(id, modelDisplayMap);
  if (entry) {
    return { displayName: entry.displayName, subLabel: entry.subLabel ?? id };
  }
  return { displayName: id, subLabel: id };
}

/** Display info from ModelInfo (CLI data). Falls back to modelDisplayMap, then raw ID. */
export function getModelInfoDisplayName(
  info: ModelInfo | undefined,
  fallbackId: string,
  modelDisplayMap: ModelDisplayMapEntry[] = [],
): ModelDisplayInfo {
  if (info?.displayName) {
    return { displayName: info.displayName, subLabel: info.description ?? fallbackId };
  }
  return getModelDisplayInfo(fallbackId, null, modelDisplayMap);
}

import {
  type EffortLevel,
  effortLevelSchema,
  type ModelInfo,
  type UsageQuota,
  type UsageQuotaTier,
  usageQuotaSchema,
  usageQuotaTierSchema,
} from '@code-quest/shared';

interface ModelDisplayInfo {
  displayName: string;
  subLabel: string;
}

export function findModel(id: string, models: ModelInfo[]): ModelInfo | undefined {
  const exact = models.find((m) => m.value === id);
  if (exact) return exact;
  const baseId = id.replace(/\[.*\]$/, '');
  if (baseId !== id) {
    const stripped = models.find((m) => m.value === baseId);
    if (stripped) return stripped;
  }
  return models.find((m) => m.value.length > 2 && id.includes(m.value));
}

/** Short display name for a model ID. Looks up in availableModels, falls back to raw ID. */
export function shortModelName(id: string, models: ModelInfo[] = []): string {
  return findModel(id, models)?.displayName ?? id;
}

/** Display info for model picker. Looks up in availableModels. */
export function getModelDisplayInfo(
  id: string,
  models: ModelInfo[] = [],
  defaultModelDescription = 'Most capable for complex work',
): ModelDisplayInfo {
  if (id === '') {
    const defaultEntry = models[0];
    const label = defaultEntry?.displayName ?? '';
    return {
      displayName: 'Default (recommended)',
      subLabel: label ? `${label} · ${defaultModelDescription}` : defaultModelDescription,
    };
  }
  const entry = findModel(id, models);
  if (entry?.displayName) {
    return { displayName: entry.displayName, subLabel: entry.description ?? id };
  }
  return { displayName: id, subLabel: id };
}

/** Effort levels supported by a model entry, validated against the schema. */
export function getEffortLevels(modelEntry: ModelInfo | undefined): EffortLevel[] {
  const raw =
    modelEntry?.supportedEffortLevels ??
    (modelEntry?.supportsEffort ? effortLevelSchema.options : []);
  return raw.filter((v: unknown): v is EffortLevel => effortLevelSchema.safeParse(v).success);
}

/** Display info from ModelInfo (CLI data). Falls back to availableModels lookup, then raw ID. */
export function getModelInfoDisplayName(
  info: ModelInfo | undefined,
  fallbackId: string,
  models: ModelInfo[] = [],
): ModelDisplayInfo {
  if (info?.displayName) {
    return { displayName: info.displayName, subLabel: info.description ?? fallbackId };
  }
  return getModelDisplayInfo(fallbackId, models);
}

export function isThinkingActive(level: string | undefined | null): boolean {
  return !!level && level !== 'off' && level !== 'disabled';
}

export const DEFAULT_USAGE_TIERS = [
  { key: 'five_hour', label: 'Session (5hr)', shortLabel: '5hr' },
  { key: 'seven_day', label: 'Weekly (7 day)', shortLabel: '7day' },
  { key: 'seven_day_sonnet', label: 'Weekly Sonnet', shortLabel: 'Sonnet' },
] as const;

type TierKey = keyof typeof usageQuotaSchema.shape;

export function getTier(usage: UsageQuota, key: string): UsageQuotaTier | undefined {
  const value = key in usageQuotaSchema.shape ? usage[key as TierKey] : undefined;
  return usageQuotaTierSchema.safeParse(value).data;
}

import { type EffortLevel, effortLevelSchema, type ModelInfo } from '@code-quest/shared';

interface ModelDisplayInfo {
  displayName: string;
  subLabel: string;
}

/** Find model by exact value match, then substring match (strips [context] suffix). */
export function findModel(id: string, models: ModelInfo[]): ModelInfo | undefined {
  // Exact match
  const exact = models.find((m) => m.value === id);
  if (exact) return exact;
  // Strip context window suffix like [1m] for matching
  const baseId = id.replace(/\[.*\]$/, '');
  if (baseId !== id) {
    const stripped = models.find((m) => m.value === baseId);
    if (stripped) return stripped;
  }
  // Substring: id contains value (e.g. "claude-opus-4-6" contains "opus")
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

import {
  type UsageQuota,
  type UsageQuotaTier,
  usageQuotaSchema,
  usageQuotaTierSchema,
} from '@code-quest/shared';

export const DEFAULT_USAGE_TIERS: readonly [
  { readonly key: 'five_hour'; readonly label: 'Session (5hr)'; readonly shortLabel: '5hr' },
  { readonly key: 'seven_day'; readonly label: 'Weekly (7 day)'; readonly shortLabel: '7day' },
  {
    readonly key: 'seven_day_sonnet';
    readonly label: 'Weekly Sonnet';
    readonly shortLabel: 'Sonnet';
  },
] = [
  { key: 'five_hour' as const, label: 'Session (5hr)', shortLabel: '5hr' },
  { key: 'seven_day' as const, label: 'Weekly (7 day)', shortLabel: '7day' },
  { key: 'seven_day_sonnet' as const, label: 'Weekly Sonnet', shortLabel: 'Sonnet' },
];

type TierKey = keyof typeof usageQuotaSchema.shape;

/** Type-safe tier lookup — avoids `as Record<string, unknown>` cast. */
export function getTier(usage: UsageQuota, key: string): UsageQuotaTier | undefined {
  const value = key in usageQuotaSchema.shape ? usage[key as TierKey] : undefined;
  return usageQuotaTierSchema.safeParse(value).data;
}

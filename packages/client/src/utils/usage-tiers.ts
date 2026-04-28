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

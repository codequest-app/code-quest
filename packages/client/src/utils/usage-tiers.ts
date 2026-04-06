import { type UsageQuota, type UsageQuotaTier, usageQuotaTierSchema } from '@code-quest/shared';

export const DEFAULT_USAGE_TIERS = [
  { key: 'five_hour' as const, label: 'Session (5hr)', shortLabel: '5hr' },
  { key: 'seven_day' as const, label: 'Weekly (7 day)', shortLabel: '7day' },
  { key: 'seven_day_sonnet' as const, label: 'Weekly Sonnet', shortLabel: 'Sonnet' },
];

type TierKey = 'five_hour' | 'seven_day' | 'seven_day_sonnet';

/** Type-safe tier lookup — avoids `as Record<string, unknown>` cast. */
export function getTier(usage: UsageQuota, key: string): UsageQuotaTier | undefined {
  const value = (key as TierKey) in usage ? usage[key as TierKey] : undefined;
  return usageQuotaTierSchema.safeParse(value).data;
}

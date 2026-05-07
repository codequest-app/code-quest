import type { UsageQuota, UsageQuotaTier } from '@code-quest/shared';
import { injectable } from 'inversify';

const KNOWN_TIERS = ['five_hour', 'seven_day', 'seven_day_sonnet'] as const;
type TierName = (typeof KNOWN_TIERS)[number];

function isTierName(value: string | undefined): value is TierName {
  return !!value && (KNOWN_TIERS as readonly string[]).includes(value);
}

interface RateLimitInfo {
  status: string;
  rateLimitType?: string;
  resetsAt?: number;
  utilization?: number;
  overageStatus?: string;
  isUsingOverage?: boolean;
}

@injectable()
export class UsageTracker {
  private tiers = new Map<TierName, { status: string; resetsAt?: number; utilization?: number }>();
  private extraUsage?: { is_enabled: boolean; overageStatus?: string };

  update(info: RateLimitInfo): void {
    const tierName = info.rateLimitType;
    if (isTierName(tierName)) {
      this.tiers.set(tierName, {
        status: info.status,
        resetsAt: info.resetsAt,
        utilization: info.utilization,
      });
    }

    if (info.isUsingOverage !== undefined) {
      this.extraUsage = { is_enabled: info.isUsingOverage };
      if (info.overageStatus) {
        this.extraUsage.overageStatus = info.overageStatus;
      }
    }
  }

  getUsage(): UsageQuota {
    const usage: UsageQuota = {};

    for (const [tier, data] of this.tiers) {
      const entry: UsageQuotaTier = {
        utilization: data.utilization ?? (data.status === 'blocked' ? 1.0 : 0),
      };
      if (data.resetsAt !== undefined) {
        entry.resets_at = new Date(data.resetsAt * 1_000).toISOString();
      }
      usage[tier] = entry;
    }

    if (this.extraUsage) {
      usage.extra_usage = this.extraUsage;
    }

    return usage;
  }
}

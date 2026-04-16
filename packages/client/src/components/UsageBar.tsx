import type { UsageQuota } from '@code-quest/shared';
import { useChannelConfig } from '../contexts/channel';
import { cn } from '../utils/cn';
import { formatResetTime } from '../utils/format-reset-time';
import { DEFAULT_USAGE_TIERS, getTier } from '../utils/usage-tiers';

interface UsageBarProps {
  usage: UsageQuota;
}

function tierColor(utilization: number): string {
  return utilization >= 0.8 ? 'bg-danger' : 'bg-accent';
}

function TierBar({
  label,
  utilization,
  resetsAt,
}: {
  label: string;
  utilization: number;
  resetsAt?: string;
}) {
  const pct = Math.min(100, utilization * 100);
  const resetText = resetsAt ? formatResetTime(resetsAt) : null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-sm overflow-hidden">
        <div
          data-testid={`usage-bar-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className={cn('h-full rounded-sm transition-all', tierColor(utilization))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct.toFixed(0)}%</span>
      {resetText && <span className="text-text-muted/40">resets {resetText}</span>}
    </div>
  );
}

export function UsageBar({ usage }: UsageBarProps) {
  const { providerConfig } = useChannelConfig();
  const usageTiers =
    providerConfig?.usageTiers?.map((t) => ({ key: t.key, label: t.shortLabel })) ??
    DEFAULT_USAGE_TIERS.map((t) => ({ key: t.key, label: t.shortLabel }));
  return (
    <div
      className="flex flex-col gap-1 text-[11px] text-text-muted/60 font-mono"
      data-testid="usage-bar"
    >
      {usageTiers.map(({ key, label }) => {
        const tier = getTier(usage, key);
        if (!tier) return null;
        return (
          <TierBar
            key={key}
            label={label}
            utilization={tier.utilization}
            resetsAt={tier.resets_at}
          />
        );
      })}
      {usage.extra_usage?.is_enabled && usage.extra_usage.utilization != null && (
        <div className="flex items-center gap-2">
          <TierBar label="Extra" utilization={usage.extra_usage.utilization} />
          {usage.extra_usage.overageStatus && (
            <span className="text-[10px] px-1 rounded bg-warning/20 text-warning">Overage</span>
          )}
        </div>
      )}
    </div>
  );
}

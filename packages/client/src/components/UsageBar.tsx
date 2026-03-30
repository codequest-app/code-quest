import type { UsageQuota } from '@code-quest/shared';
import { useChannelConfig } from '../contexts/channel';

interface UsageBarProps {
  usage: UsageQuota;
}

const USAGE_THRESHOLDS = { danger: 0.8, warning: 0.5 } as const;

function tierColor(utilization: number): string {
  if (utilization > USAGE_THRESHOLDS.danger) return 'bg-danger';
  if (utilization > USAGE_THRESHOLDS.warning) return 'bg-warning';
  return 'bg-success';
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
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          data-testid={`usage-bar-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className={`h-full rounded-full transition-all ${tierColor(utilization)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct.toFixed(0)}%</span>
      {resetsAt && (
        <span className="text-text-muted/40">
          resets {new Date(resetsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

const DEFAULT_USAGE_TIERS = [
  { key: 'five_hour', label: '5hr' },
  { key: 'seven_day', label: '7day' },
  { key: 'seven_day_sonnet', label: 'Sonnet' },
];

export function UsageBar({ usage }: UsageBarProps) {
  const { providerConfig } = useChannelConfig();
  const usageTiers =
    providerConfig?.usageTiers?.map((t) => ({ key: t.key, label: t.shortLabel })) ??
    DEFAULT_USAGE_TIERS;
  return (
    <div
      className="flex flex-col gap-1 text-[11px] text-text-muted/60 font-mono"
      data-testid="usage-bar"
    >
      {usageTiers.map(({ key, label }) => {
        const tier = (usage as Record<string, { utilization: number; resets_at?: string }>)[key];
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

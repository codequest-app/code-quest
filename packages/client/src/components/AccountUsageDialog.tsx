import type { ChatStats, ProviderClientConfig, UsageQuota } from '@code-quest/shared';

interface ContextCategory {
  name: string;
  tokens: number;
  color: string;
}

interface ContextUsageData {
  categories?: ContextCategory[];
  totalTokens?: number;
  maxTokens?: number;
  percentage?: number;
}

interface AccountUsageDialogProps {
  open: boolean;
  onClose: () => void;
  model?: string;
  authMethod?: string;
  email?: string;
  organization?: string;
  subscriptionType?: string;
  usage?: UsageQuota;
  contextUsage?: Record<string, unknown>;
  stats?: ChatStats;
  providerConfig?: ProviderClientConfig;
}

const DEFAULT_AUTH_METHODS: Record<string, string> = {
  claudeai: 'Claude AI',
  console: 'Anthropic Console',
  'api-key': 'API Key',
  '3p': 'Third Party',
  'not-specified': 'Not Specified',
};

function formatAuthMethod(
  method: string,
  authMethods?: ProviderClientConfig['authMethods'],
): string {
  const configLabel = authMethods?.find((m) => m.id === method)?.label;
  if (configLabel) return configLabel;
  return DEFAULT_AUTH_METHODS[method] ?? 'Not authenticated';
}

function formatResetTime(resetsAt: string): string | null {
  try {
    const ms = new Date(resetsAt).getTime() - Date.now();
    if (ms <= 0) return 'soon';
    const min = Math.floor(ms / 60000);
    const hrs = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    if (min < 60) return `in ${min}m`;
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${days}d`;
  } catch {
    return null;
  }
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-[13px] py-1">
      <span className="text-text/70">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}

function UsageBarRow({
  label,
  utilization,
  resetsAt,
}: {
  label: string;
  utilization: number;
  resetsAt?: string;
}) {
  const pct = Math.min(100, Math.floor(utilization * 100));
  const isHigh = pct >= 80;
  const resetText = resetsAt ? formatResetTime(resetsAt) : null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[13px]">
        <span className="text-text">{label}</span>
        <span className="text-text tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? 'bg-danger' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {resetText && <div className="text-[11px] text-text/50">Resets {resetText}</div>}
    </div>
  );
}

const DEFAULT_USAGE_TIERS = [
  { key: 'five_hour', label: 'Session (5hr)' },
  { key: 'seven_day', label: 'Weekly (7 day)' },
  { key: 'seven_day_sonnet', label: 'Weekly Sonnet' },
];

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function AccountUsageDialog({
  open,
  onClose,
  model,
  authMethod,
  email,
  organization,
  subscriptionType,
  usage,
  contextUsage: rawContextUsage,
  stats,
  providerConfig,
}: AccountUsageDialogProps) {
  const contextUsage = rawContextUsage as ContextUsageData | undefined;
  if (!open) return null;

  return (
    <div
      role="none"
      data-testid="dialog-backdrop"
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        role="dialog"
        aria-label="Account & Usage"
        className="bg-bg border border-border rounded-lg w-[400px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] overflow-y-auto m-4 p-4 select-text outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-text">Account & Usage</h2>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* ACCOUNT section */}
          <div className="space-y-1">
            <h4 className="text-[12px] font-semibold text-text/70 uppercase tracking-[0.5px] mb-2">
              Account
            </h4>
            {model && <AccountRow label="Model" value={model} />}
            {authMethod && (
              <AccountRow
                label="Auth method"
                value={formatAuthMethod(authMethod, providerConfig?.authMethods)}
              />
            )}
            {email && <AccountRow label="Email" value={email} />}
            {organization && <AccountRow label="Organization" value={organization} />}
            {subscriptionType && <AccountRow label="Plan" value={subscriptionType} />}
          </div>

          {/* SESSION section */}
          {stats && (stats.costUsd != null || stats.numTurns != null) && (
            <div className="space-y-1">
              <h4 className="text-[12px] font-semibold text-text/70 uppercase tracking-[0.5px] mb-2">
                Session
              </h4>
              {stats.costUsd != null && (
                <AccountRow label="Cost" value={`$${stats.costUsd.toFixed(2)}`} />
              )}
              {stats.numTurns != null && (
                <AccountRow label="Turns" value={String(stats.numTurns)} />
              )}
              {stats.modelUsage &&
                Object.entries(stats.modelUsage).map(([m, u]) => (
                  <AccountRow
                    key={m}
                    label={m.split('-').slice(0, 2).join(' ')}
                    value={`$${((u as { costUSD?: number }).costUSD ?? 0).toFixed(2)}`}
                  />
                ))}
            </div>
          )}

          {/* CONTEXT section */}
          {contextUsage?.categories && (
            <div className="space-y-2">
              <h4 className="text-[12px] font-semibold text-text/70 uppercase tracking-[0.5px]">
                Context ({contextUsage.percentage ?? 0}% used)
              </h4>
              <div className="text-[11px] text-text-muted mb-1">
                {formatTokens(contextUsage.totalTokens ?? 0)} /{' '}
                {formatTokens(contextUsage.maxTokens ?? 0)} tokens
              </div>
              {contextUsage.categories
                .filter((c) => c.name !== 'Free space')
                .map((cat) => (
                  <div key={cat.name} className="flex justify-between text-[12px]">
                    <span className="text-text/70">{cat.name}</span>
                    <span className="text-text tabular-nums">{formatTokens(cat.tokens)}</span>
                  </div>
                ))}
            </div>
          )}

          {/* QUOTA section */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-semibold text-text/70 uppercase tracking-[0.5px]">
              Quota
            </h4>
            {usage ? (
              (
                providerConfig?.usageTiers?.map((t) => ({ key: t.key, label: t.label })) ??
                DEFAULT_USAGE_TIERS
              ).map(({ key, label }) => {
                const tier = (usage as Record<string, { utilization: number; resets_at?: string }>)[
                  key
                ];
                if (!tier) return null;
                return (
                  <UsageBarRow
                    key={key}
                    label={label}
                    utilization={tier.utilization}
                    resetsAt={tier.resets_at}
                  />
                );
              })
            ) : (
              <p className="text-xs text-text-muted">Loading usage data…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

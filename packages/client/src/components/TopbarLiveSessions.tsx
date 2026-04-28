import type { SessionStateSummary } from '@code-quest/shared';
import { toast } from 'sonner';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';
import { LiveSessionPopover } from './LiveSessionPopover';

const MAX_VISIBLE = 5;

const LIVE_STATES = new Set(['busy', 'launching', 'idle']);

const DOT_CLASS: Record<string, string> = {
  busy: 'bg-success animate-pulse',
  launching: 'bg-warning animate-pulse',
  idle: 'bg-text-dim',
  exited: 'bg-text-dim',
  disconnected: 'bg-danger',
};

export interface TopbarLiveSessionsProps {
  sessions: SessionStateSummary[];
  onActivate: (channelId: string) => void;
  onStop?: (channelId: string) => void;
  onSplit?: (channelId: string) => void;
}

export function TopbarLiveSessions({
  sessions,
  onActivate,
  onStop,
  onSplit,
}: TopbarLiveSessionsProps): React.JSX.Element {
  const live = sessions.filter((s) => LIVE_STATES.has(s.state));
  const visible = live.slice(0, MAX_VISIBLE);
  const overflow = live.length - visible.length;

  return (
    <section aria-label="topbar-live-sessions" className="flex items-center gap-1">
      {visible.map((s) => {
        const label = labelFor(s);
        return (
          <span key={s.channelId} className="group inline-flex items-center">
            <button
              type="button"
              aria-label={`${label} (${s.state})`}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-l border border-border text-xs text-text-muted hover:text-text hover:bg-white/5"
              onClick={() => onActivate(s.channelId)}
              title={s.title ?? label}
            >
              <span
                className={cn('w-1.5 h-1.5 rounded-full', DOT_CLASS[s.state] ?? 'bg-text-dim')}
              />
              <span className="font-mono truncate max-w-32">{label}</span>
            </button>
            <LiveSessionPopover
              session={s}
              trigger={
                <button
                  type="button"
                  aria-label={`More actions for ${label}`}
                  className="px-1 py-0.5 rounded-r border border-l-0 border-border text-xs text-text-dim hover:text-text hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  ⋯
                </button>
              }
              onOpen={onActivate}
              onStop={onStop ?? ((cid: string) => toast(`Stop ${cid} — coming soon`))}
              onSplit={onSplit ?? ((cid: string) => toast(`Split chat — coming soon (${cid})`))}
            />
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="px-1.5 py-0.5 rounded border border-border text-xs text-text-dim">
          +{overflow}
        </span>
      )}
    </section>
  );
}

function labelFor(s: SessionStateSummary): string {
  const proj = basename(s.projectRoot);
  if (!s.cwd || s.cwd === s.projectRoot) return proj;
  return `${proj}/${basename(s.cwd)}`;
}

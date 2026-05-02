import type { Ack, McpServerInfo, ProviderClientConfig, RpcResult } from '@code-quest/shared';
import { useState } from 'react';
import { useChannelConfig } from '@/contexts/channel';
import { cn } from '@/utils/cn';
import { Button } from '../ui/Button.tsx';
import { Dialog, DialogClose, DialogContent } from '../ui/Dialog.tsx';
import { XIcon } from '../ui/Icons.tsx';
import { InlineAction } from '../ui/InlineAction.tsx';

// ── mo0: scope group ordering (po0) ─────────────────────────────────────────
const SCOPE_ORDER = ['project', 'local', 'user', 'claudeai', 'managed', 'enterprise'];

const DEFAULT_SCOPE_LABELS: Record<string, string> = {
  project: 'Project',
  local: 'Local',
  user: 'User',
  claudeai: 'claude.ai',
  managed: 'Managed',
  enterprise: 'Enterprise',
};

function scopeLabel(scope: string, mcpScopes?: ProviderClientConfig['mcpScopes']): string {
  const configLabel = mcpScopes?.find((s) => s.id === scope)?.label;
  return configLabel ?? DEFAULT_SCOPE_LABELS[scope] ?? scope;
}

function inferScope(name: string, mcpScopes?: ProviderClientConfig['mcpScopes']): string {
  if (mcpScopes) {
    const match = mcpScopes.find((s) => s.prefix && name.startsWith(s.prefix));
    if (match) return match.id;
  }
  return name.startsWith('claude.ai ') ? 'claudeai' : 'user';
}

function groupByScope(
  servers: McpServerInfo[],
  mcpScopes?: ProviderClientConfig['mcpScopes'],
): Array<[string, McpServerInfo[]]> {
  const map = new Map<string, McpServerInfo[]>();
  for (const s of servers) {
    const scope = s.scope ?? inferScope(s.name, mcpScopes);
    const group = map.get(scope);
    if (group) group.push(s);
    else map.set(scope, [s]);
  }
  for (const g of map.values()) g.sort((a, b) => a.name.localeCompare(b.name));
  const result: Array<[string, McpServerInfo[]]> = [];
  for (const scope of SCOPE_ORDER) {
    const group = map.get(scope);
    if (group) result.push([scope, group]);
  }
  for (const [scope, group] of map) {
    if (!SCOPE_ORDER.includes(scope)) result.push([scope, group]);
  }
  return result;
}

interface StatusMeta {
  icon?: string;
  label?: string;
  badge?: string;
}

const STATUS_CONFIG: Record<string, StatusMeta> = {
  connected: { icon: '✓', label: 'Connected', badge: 'bg-success text-white' },
  failed: { icon: '✗', label: 'Failed', badge: 'bg-danger text-white' },
  error: { badge: 'bg-danger text-white' },
  'needs-auth': { icon: '⚠', label: 'Needs Auth', badge: 'bg-warning text-black' },
  pending: { icon: '◐', label: 'Connecting…', badge: 'bg-text-muted/60 text-white' },
  connecting: { label: 'Connecting…', badge: 'bg-text-muted/60 text-white' },
  disabled: { icon: '○', label: 'Disabled', badge: 'bg-border text-text-muted' },
};

const DEFAULT_BADGE = 'bg-border text-text-muted';

const statusIcon = (status: string): string => STATUS_CONFIG[status]?.icon ?? '?';
const statusLabel = (status: string): string => STATUS_CONFIG[status]?.label ?? status;
const statusBadgeCls = (status: string): string => STATUS_CONFIG[status]?.badge ?? DEFAULT_BADGE;

// ── So0: plain status badge (no icon, raw status string) ────────────────────
function PlainStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('shrink-0 rounded px-2 py-1 text-xs font-medium', statusBadgeCls(status))}>
      {status}
    </span>
  );
}

// ── mo0: icon + label badge ───────────────────────────────────────────────────
function RichStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('shrink-0 rounded px-2 py-1 text-xs font-medium', statusBadgeCls(status))}>
      {statusIcon(status)} {statusLabel(status)}
    </span>
  );
}

interface ManageMcpDialogProps {
  open: boolean;
  onClose: () => void;
  servers: McpServerInfo[];
  // Management callbacks — omit for read-only (So0) mode
  onReconnect?: (name: string) => Promise<void>;
  onToggle?: (name: string, enabled: boolean) => Promise<void>;
  onAuthenticate?: (name: string) => Promise<RpcResult<{ authUrl?: string }>>;
  onClearAuth?: (name: string) => Promise<Ack>;
  onRefresh?: () => void;
}

type PendingAction = { server: string; action: string } | null;

export function ManageMcpDialog({
  open,
  onClose,
  servers,
  onReconnect,
  onToggle,
  onAuthenticate,
  onClearAuth,
  onRefresh,
}: ManageMcpDialogProps): React.JSX.Element {
  const { providerConfig } = useChannelConfig();
  const mcpScopes = providerConfig?.mcpScopes;

  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const isManageable = !!(onReconnect || onToggle || onAuthenticate);
  const groups = groupByScope(servers, mcpScopes);
  const detail = selectedServer ? servers.find((s) => s.name === selectedServer) : null;

  const act = async (action: string, fn: () => Promise<void>) => {
    setFeedback(null);
    setPending({ server: selectedServer ?? '', action });
    try {
      await fn();
      onRefresh?.();
    } catch (e) {
      console.error(e);
      setFeedback({ msg: e instanceof Error ? e.message : 'Failed', ok: false });
    } finally {
      setPending(null);
    }
  };

  const handleClose = () => {
    setSelectedServer(null);
    setFeedback(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent title="Manage MCP Servers" className="w-96" hideTitle={true}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-text">
            {detail ? (
              <InlineAction
                variant="muted"
                className="flex items-center gap-1"
                onClick={() => {
                  setSelectedServer(null);
                  setFeedback(null);
                }}
              >
                ← {detail.name}
              </InlineAction>
            ) : (
              'Manage MCP Servers'
            )}
          </span>
          <DialogClose
            aria-label="Close"
            className="p-1 text-text-muted hover:text-text hover:bg-white/5 rounded"
          >
            <XIcon className="w-4 h-4" />
          </DialogClose>
        </div>

        {/* ── So0 mode: read-only flat list ─────────────────────────────── */}
        {!isManageable && !detail && (
          <>
            {servers.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">No running MCP servers.</p>
            ) : (
              <ul className="my-2">
                {servers.map((s) => (
                  <li
                    key={s.name}
                    className={cn(
                      'flex items-center justify-between gap-3 bg-bg-secondary border border-border rounded p-3 mb-2 last:mb-0',
                      s.status === 'disabled' && 'opacity-60',
                    )}
                  >
                    <span className="font-mono text-xs font-medium text-text truncate">
                      {s.name}
                    </span>
                    <PlainStatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
            {/* So0 footer */}
            <div className="text-xs text-text-muted mt-4">
              You can use the{' '}
              <code className="font-mono bg-bg-secondary px-1 rounded">claude mcp add</code>{' '}
              command-line tool to configure system-wide or private servers.
              <br />
              <a
                href="https://code.claude.com/docs/en/mcp"
                target="_blank"
                rel="noreferrer"
                className="text-text-muted hover:underline"
              >
                Learn more
              </a>
            </div>
          </>
        )}

        {/* ── mo0 mode: grouped list ────────────────────────────────────── */}
        {isManageable && !detail && (
          <>
            {servers.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">No MCP servers configured.</p>
            ) : (
              <div className="my-2">
                {groups.map(([scope, group]) => (
                  <div key={scope}>
                    <div className="text-xs font-semibold text-text-muted pb-1 pt-2 first:pt-0">
                      {scopeLabel(scope, mcpScopes)} ({group.length})
                    </div>
                    {group.map((s) => (
                      <button
                        type="button"
                        key={s.name}
                        onClick={() => {
                          setFeedback(null);
                          setSelectedServer(s.name);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 bg-bg-secondary border border-border rounded p-3 mb-2 last:mb-0 cursor-pointer hover:bg-bg-secondary/60',
                          s.status === 'disabled' && 'opacity-60',
                        )}
                      >
                        <span className="font-mono text-xs font-medium text-text truncate">
                          {s.name}
                        </span>
                        <RichStatusBadge status={s.status} />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {/* mo0 footer */}
            <div className="border-t border-border mt-4 pt-4">
              <a
                href="https://code.claude.com/docs/en/mcp"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-text-muted hover:underline"
              >
                Learn more about MCP
              </a>
            </div>
          </>
        )}

        {/* ── mo0 detail view ──────────────────────────────────────────── */}
        {detail && isManageable && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-bg-secondary border border-border rounded p-3">
              <span className="font-mono text-xs font-medium text-text">{detail.name}</span>
              <RichStatusBadge status={detail.status} />
            </div>

            {feedback && (
              <p className={cn('text-xs', feedback.ok ? 'text-success' : 'text-danger')}>
                {feedback.msg}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {onReconnect &&
                (detail.status === 'connected' ||
                  detail.status === 'failed' ||
                  detail.status === 'error') && (
                  <Button
                    variant="secondary"
                    size="xs"
                    disabled={!!pending}
                    onClick={() => act('reconnect', () => onReconnect(detail.name))}
                  >
                    {pending?.action === 'reconnect' ? 'Reconnecting…' : 'Reconnect'}
                  </Button>
                )}

              {onToggle && detail.status !== 'disabled' ? (
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={!!pending}
                  onClick={() => act('disable', () => onToggle(detail.name, false))}
                >
                  {pending?.action === 'disable' ? 'Disabling…' : 'Disable'}
                </Button>
              ) : onToggle ? (
                <Button
                  size="xs"
                  disabled={!!pending}
                  onClick={() => act('enable', () => onToggle(detail.name, true))}
                >
                  {pending?.action === 'enable' ? 'Enabling…' : 'Enable'}
                </Button>
              ) : null}

              {onAuthenticate && (detail.status === 'needs-auth' || detail.status === 'failed') && (
                <Button
                  size="xs"
                  disabled={!!pending}
                  onClick={() =>
                    act('authenticate', async () => {
                      const res = await onAuthenticate(detail.name);
                      if (!res.ok) setFeedback({ msg: res.error, ok: false });
                      else if (res.data.authUrl)
                        setFeedback({ msg: `Open: ${res.data.authUrl}`, ok: true });
                    })
                  }
                >
                  {pending?.action === 'authenticate' ? 'Authenticating…' : 'Authenticate'}
                </Button>
              )}

              {onClearAuth && detail.status === 'connected' && (
                <Button
                  variant="secondary"
                  size="xs"
                  className="text-danger"
                  disabled={!!pending}
                  onClick={() =>
                    act('clearAuth', async () => {
                      const res = await onClearAuth(detail.name);
                      if (!res.ok) setFeedback({ msg: res.error, ok: false });
                      else setFeedback({ msg: 'Auth cleared', ok: true });
                    })
                  }
                >
                  {pending?.action === 'clearAuth' ? 'Clearing…' : 'Clear Auth'}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

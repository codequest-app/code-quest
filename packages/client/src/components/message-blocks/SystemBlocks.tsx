import type { ChatStats } from '@code-quest/shared';
import { MarkdownContent } from '../MarkdownContent';
import { CODE_BLOCK_CLASS, CollapsibleBlock } from './shared';

const CONTROL_RESPONSE_STYLES = [
  {
    prefix: 'Allowed Always',
    icon: '✓✓',
    colorClass: 'text-success bg-success-bg border-l-success',
  },
  { prefix: 'Approved', icon: '✓', colorClass: 'text-success bg-success-bg border-l-success' },
  { prefix: 'Denied & Stopped', icon: '⊘', colorClass: 'text-danger bg-danger-bg border-l-danger' },
  { prefix: 'Denied', icon: '✗', colorClass: 'text-warning bg-warning-bg border-l-warning' },
] as const;

const CONTROL_RESPONSE_DEFAULT = {
  icon: '↩',
  colorClass: 'text-text-muted bg-text-muted/10 border-l-text-muted',
};

export function PendingActionContent({ content }: { content: string }) {
  return (
    <div className="bg-warning-bg border-l-2 border-l-warning px-4 py-2.5 rounded-r-lg">
      <strong className="text-warning text-sm">⚠ Tool Approval: {content}</strong>
    </div>
  );
}

export function ControlResponseContent({ content }: { content: string }) {
  const { icon, colorClass } =
    CONTROL_RESPONSE_STYLES.find((s) => content.startsWith(s.prefix)) ?? CONTROL_RESPONSE_DEFAULT;
  return (
    <div className={`border-l-2 px-4 py-2 rounded-r-lg ${colorClass}`}>
      <span className="text-sm font-medium">
        {icon} {content}
      </span>
    </div>
  );
}

export function ResultContent({ meta }: { meta?: Record<string, unknown> }) {
  const stats = meta?.stats as ChatStats | undefined;
  return (
    <div className="flex items-center gap-3 py-2 text-text-muted/40 text-xs" data-type="result">
      <div className="flex-1 border-t border-text-muted/20" />
      {stats && (
        <div className="flex gap-3 font-mono text-[11px] text-text-muted/50">
          {stats.costUsd != null && <span>${stats.costUsd.toFixed(4)}</span>}
          {stats.durationMs != null && <span>{(stats.durationMs / 1000).toFixed(1)}s</span>}
          {stats.inputTokens != null && <span>↑{stats.inputTokens}</span>}
          {stats.outputTokens != null && <span>↓{stats.outputTokens}</span>}
          {stats.numTurns != null && <span>{stats.numTurns} turns</span>}
        </div>
      )}
      <div className="flex-1 border-t border-text-muted/20" />
    </div>
  );
}

export function ErrorContent({ content }: { content: string }) {
  return (
    <div
      className="text-danger bg-danger-bg rounded-lg px-4 py-3 border border-danger/20"
      data-type="error"
    >
      {content}
    </div>
  );
}

export function CompactBoundaryContent() {
  return (
    <div className="flex items-center gap-3 py-2 text-text-muted/40 text-xs">
      <div className="flex-1 border-t border-text-muted/20" />
      <span>Context was compressed</span>
      <div className="flex-1 border-t border-text-muted/20" />
    </div>
  );
}

export function InterruptContent() {
  return (
    <div className="flex items-center gap-2 text-xs text-warning py-1">
      <span>⚠</span>
      <span className="italic">Interrupted by user</span>
    </div>
  );
}

export function MetaContent({ content }: { content: string }) {
  if (!content) return null;
  return <div className="text-xs text-text-muted/60 py-1 italic">{content}</div>;
}

export function SlashCommandResultContent({ content }: { content: string }) {
  if (!content.includes('\n')) {
    const short = content.replace(/^Set model to /, 'Switched to ');
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted bg-surface-hover rounded-full px-2.5 py-1">
        <span>✓</span>
        <span>{short}</span>
      </div>
    );
  }
  return (
    <div className="text-sm text-text-muted">
      <MarkdownContent content={content} />
    </div>
  );
}

export function RateLimitContent({
  content,
  meta,
}: {
  content: string;
  meta?: Record<string, unknown>;
}) {
  const info = meta?.rateLimitInfo as Record<string, unknown> | undefined;
  return (
    <div className="bg-warning-bg border-l-2 border-l-warning px-4 py-2.5 rounded-r-lg">
      <span className="text-warning text-sm font-medium">⏳ {content}</span>
      {info && (
        <span className="ml-2 text-xs text-text-muted">
          {info.rateLimitType ? <span className="mr-2">{String(info.rateLimitType)}</span> : null}
          {info.resetsAt ? (
            <span>resets {new Date(info.resetsAt as number).toLocaleTimeString()}</span>
          ) : null}
          {info.isUsingOverage === true && (
            <span className="ml-2 text-danger font-medium">Overage active</span>
          )}
          {info.overageStatus && info.isUsingOverage !== true ? (
            <span className="ml-2 text-warning">Overage: {String(info.overageStatus)}</span>
          ) : null}
        </span>
      )}
    </div>
  );
}

export function TaskStartedContent({
  content,
  meta,
}: {
  content: string;
  meta?: Record<string, unknown>;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <span>🚀</span>
      <span>{content}</span>
      {meta?.taskType != null && (
        <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-mono">
          {String(meta.taskType)}
        </span>
      )}
    </div>
  );
}

export function StreamlinedTextContent({ content }: { content: string }) {
  return (
    <div className="relative">
      <span className="absolute -top-1 right-0 text-[10px] text-text-muted/50 font-mono">
        fast mode
      </span>
      <MarkdownContent content={content} />
    </div>
  );
}

export function StreamlinedToolSummaryContent({ content }: { content: string }) {
  return (
    <CollapsibleBlock icon="⚡" label="Tool Summary">
      <pre className={CODE_BLOCK_CLASS}>{content}</pre>
    </CollapsibleBlock>
  );
}

export function ImageContent({ meta }: { meta?: Record<string, unknown> }) {
  const source = meta?.source as { type?: string; media_type?: string; data?: string } | undefined;
  if (!source?.data || source.type !== 'base64') return null;
  const dataUrl = `data:${source.media_type ?? 'image/png'};base64,${source.data}`;
  return (
    <div className="my-2">
      <img
        src={dataUrl}
        alt="Attachment"
        className="max-w-full max-h-[400px] rounded-lg border border-border"
      />
    </div>
  );
}

export function DocumentContent({
  content,
  meta,
}: {
  content: string;
  meta?: Record<string, unknown>;
}) {
  const title = (meta?.title as string) ?? content ?? 'Document';
  const source = meta?.source as { type?: string; media_type?: string; data?: string } | undefined;
  const handleClick = () => {
    if (!source?.data) return;
    const dataUrl =
      source.type === 'base64'
        ? `data:${source.media_type ?? 'application/octet-stream'};base64,${source.data}`
        : `data:${source.media_type ?? 'text/plain'};base64,${btoa(source.data)}`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = title;
    a.click();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-code-block border border-border rounded-lg px-3 py-2 text-xs text-text hover:bg-surface-hover transition-colors cursor-pointer"
    >
      <span>📄</span>
      <span className="max-w-[200px] truncate">{title}</span>
    </button>
  );
}

export function ContentBlockStart({ meta }: { meta?: Record<string, unknown> }) {
  return (
    <div data-testid="block-placeholder" className="flex items-center gap-2 py-2">
      <div className="h-4 w-32 bg-text-muted/20 rounded animate-pulse" />
      <div className="h-4 w-20 bg-text-muted/10 rounded animate-pulse" />
      {meta?.blockType != null && (
        <span className="text-xs text-text-muted/60 font-mono">{String(meta.blockType)}...</span>
      )}
    </div>
  );
}

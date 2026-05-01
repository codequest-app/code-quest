import { MarkdownContent } from '@/components/chat/renderers/MarkdownContent';
import type { DocumentMeta, ImageMeta, RateLimitMeta, ResultMeta } from '@/types/ui';
import { cn } from '@/utils/cn';
import { AlertBanner } from './AlertBanner';
import { CenterDivider, CODE_BLOCK_CLASS, CollapsibleBlock, StatusLine } from './primitives';

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

export function PendingActionContent({ content }: { content: string }): React.ReactNode {
  return (
    <AlertBanner className="bg-warning-bg border-l-warning px-4 py-2.5">
      <strong className="text-warning text-sm">⚠ Tool Approval: {content}</strong>
    </AlertBanner>
  );
}

export function ControlResponseContent({ content }: { content: string }): React.ReactNode {
  const { icon, colorClass } =
    CONTROL_RESPONSE_STYLES.find((s) => content.startsWith(s.prefix)) ?? CONTROL_RESPONSE_DEFAULT;
  return (
    <AlertBanner className={cn('px-4 py-2.5', colorClass)}>
      <span className="text-sm font-medium">
        {icon} {content}
      </span>
    </AlertBanner>
  );
}

export function ResultContent({ meta }: { meta?: ResultMeta }): React.ReactNode {
  const stats = meta?.stats;
  return (
    <CenterDivider data-type="result">
      {stats && (
        <div className="flex gap-3 font-mono text-xs text-text-muted/60">
          {stats.costUsd != null && <span>${stats.costUsd.toFixed(4)}</span>}
          {stats.durationMs != null && <span>{(stats.durationMs / 1000).toFixed(1)}s</span>}
          {stats.inputTokens != null && <span>↑{stats.inputTokens}</span>}
          {stats.outputTokens != null && <span>↓{stats.outputTokens}</span>}
          {stats.numTurns != null && <span>{stats.numTurns} turns</span>}
        </div>
      )}
    </CenterDivider>
  );
}

export function ErrorContent({ content }: { content: string }): React.ReactNode {
  return (
    <AlertBanner className="bg-danger-bg border-l-danger px-4 py-3 text-danger" data-type="error">
      {content}
    </AlertBanner>
  );
}

export function CompactBoundaryContent(): React.ReactNode {
  return (
    <CenterDivider>
      <span>Context was compressed</span>
    </CenterDivider>
  );
}

export function InterruptContent(): React.ReactNode {
  return (
    <StatusLine icon="⚠" className="text-warning py-1">
      <span className="italic">Interrupted by user</span>
    </StatusLine>
  );
}

export function MetaContent({ content }: { content: string }): React.ReactNode {
  if (!content) return null;
  return <div className="text-xs text-text-muted/60 py-1 italic">{content}</div>;
}

export function SlashCommandResultContent({ content }: { content: string }): React.ReactNode {
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
  meta?: RateLimitMeta;
}): React.ReactNode {
  const info = meta?.rateLimitInfo;
  return (
    <AlertBanner className="bg-warning-bg border-l-warning px-4 py-2.5">
      <span className="text-warning text-sm font-medium">⏳ {content}</span>
      {info && (
        <span className="ml-2 text-xs text-text-muted">
          {info.rateLimitType ? <span className="mr-2">{String(info.rateLimitType)}</span> : null}
          {info.resetsAt ? (
            <span>resets {new Date(Number(info.resetsAt)).toLocaleTimeString()}</span>
          ) : null}
          {info.isUsingOverage === true && (
            <span className="ml-2 text-danger font-medium">Overage active</span>
          )}
          {info.overageStatus && info.isUsingOverage !== true ? (
            <span className="ml-2 text-warning">Overage: {String(info.overageStatus)}</span>
          ) : null}
        </span>
      )}
    </AlertBanner>
  );
}

export function TaskStartedContent({
  content,
  meta,
}: {
  content: string;
  meta?: Record<string, unknown>;
}): React.ReactNode {
  return (
    <StatusLine icon="🚀" className="text-text-muted">
      <span>{content}</span>
      {meta?.taskType != null && (
        <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-xs font-mono">
          {String(meta.taskType)}
        </span>
      )}
    </StatusLine>
  );
}

export function StreamlinedTextContent({ content }: { content: string }): React.ReactNode {
  return (
    <div className="relative">
      <span className="absolute -top-1 right-0 text-xs text-text-muted/60 font-mono">
        fast mode
      </span>
      <MarkdownContent content={content} />
    </div>
  );
}

export function StreamlinedToolSummaryContent({ content }: { content: string }): React.ReactNode {
  return (
    <CollapsibleBlock icon="⚡" label="Tool Summary">
      <pre className={CODE_BLOCK_CLASS}>{content}</pre>
    </CollapsibleBlock>
  );
}

export function ImageContent({ meta }: { meta?: ImageMeta }): React.ReactNode {
  const source = meta?.source;
  if (!source?.data || source.type !== 'base64') return null;
  const dataUrl = `data:${source.media_type ?? 'image/png'};base64,${source.data}`;
  return (
    <div className="my-2">
      <img
        src={dataUrl}
        alt="Attachment"
        className="max-w-full max-h-100 rounded-lg border border-border"
      />
    </div>
  );
}

export function DocumentContent({
  content,
  meta,
}: {
  content: string;
  meta?: DocumentMeta;
}): React.ReactNode {
  const title = meta?.title ?? content ?? 'Document';
  const source = meta?.source;
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
      <span className="max-w-50 truncate">{title}</span>
    </button>
  );
}

export function ContentBlockStart({ meta }: { meta?: Record<string, unknown> }): React.ReactNode {
  return (
    <div role="status" aria-label="block-placeholder" className="flex items-center gap-2 py-2">
      <div className="h-4 w-32 bg-text-muted/20 rounded animate-pulse" />
      <div className="h-4 w-20 bg-text-muted/10 rounded animate-pulse" />
      {meta?.blockType != null && (
        <span className="text-xs text-text-muted/60 font-mono">{String(meta.blockType)}...</span>
      )}
    </div>
  );
}

import type { HookDiagnosticsMeta, HookResponseMeta, HookStartedMeta } from '../../types/ui';
import { cn } from '../../utils/cn';
import { CODE_BLOCK_CLASS, CollapsibleBlock } from './shared';

export function HookStartedContent({ content, meta }: { content: string; meta?: HookStartedMeta }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <span>⚙</span>
      <span>Running hook: {content}</span>
      {meta?.hookEvent ? (
        <span className="text-text-muted/50">({String(meta.hookEvent)})</span>
      ) : null}
    </div>
  );
}

export function HookResponseContent({
  content,
  meta,
}: {
  content: string;
  meta?: HookResponseMeta;
}) {
  const output = meta?.output;
  if (!output)
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>🔗</span>
        <span>Hook done: {content}</span>
      </div>
    );
  return (
    <CollapsibleBlock icon="🔗" label={`Hook done: ${content}`}>
      <pre className={cn(CODE_BLOCK_CLASS, 'text-text-muted/80')}>{output}</pre>
    </CollapsibleBlock>
  );
}

export function HookDiagnosticsContent({
  content,
  meta,
}: {
  content: string;
  meta?: HookDiagnosticsMeta;
}) {
  const diagnostics = meta?.diagnostics;
  return (
    <details className="border border-warning/30 rounded-lg bg-warning-bg/50">
      <summary className="flex items-center gap-2 cursor-pointer select-none text-sm text-warning px-4 py-2">
        <span>⚠</span>
        <span>Hook Diagnostics: {content}</span>
      </summary>
      <div className="px-4 py-2 border-t border-warning/20">
        <pre className="text-xs text-text-muted whitespace-pre-wrap">{diagnostics ?? content}</pre>
      </div>
    </details>
  );
}

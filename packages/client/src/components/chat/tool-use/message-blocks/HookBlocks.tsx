import type { HookDiagnosticsMeta, HookResponseMeta, HookStartedMeta } from '../../../../types/ui';
import { cn } from '../../../../utils/cn';
import { CODE_BLOCK_CLASS, CollapsibleBlock, StatusLine } from './primitives';

export function HookStartedContent({
  content,
  meta,
}: {
  content: string;
  meta?: HookStartedMeta;
}): React.JSX.Element {
  return (
    <StatusLine icon="⚙" className="text-text-muted">
      <span>Running hook: {content}</span>
      {meta?.hookEvent ? (
        <span className="text-text-muted/60">({String(meta.hookEvent)})</span>
      ) : null}
    </StatusLine>
  );
}

export function HookResponseContent({
  content,
  meta,
}: {
  content: string;
  meta?: HookResponseMeta;
}): React.JSX.Element {
  const output = meta?.output;
  if (!output)
    return (
      <StatusLine icon="🔗" className="text-text-muted">
        <span>Hook done: {content}</span>
      </StatusLine>
    );
  return (
    <CollapsibleBlock icon="🔗" label={`Hook done: ${content}`}>
      <pre className={cn(CODE_BLOCK_CLASS, 'text-text-muted/60')}>{output}</pre>
    </CollapsibleBlock>
  );
}

export function HookDiagnosticsContent({
  content,
  meta,
}: {
  content: string;
  meta?: HookDiagnosticsMeta;
}): React.JSX.Element {
  const diagnostics = meta?.diagnostics;
  return (
    <details className="border border-warning/30 rounded-lg bg-warning-bg/50">
      <summary className="flex items-center gap-2 cursor-pointer select-none text-sm text-warning px-4 py-2">
        <span>⚠</span>
        <span>Hook Diagnostics: {content}</span>
      </summary>
      <div className="px-4 py-2 border-t border-warning/20">
        <pre className={cn(CODE_BLOCK_CLASS, 'whitespace-pre-wrap')}>{diagnostics ?? content}</pre>
      </div>
    </details>
  );
}

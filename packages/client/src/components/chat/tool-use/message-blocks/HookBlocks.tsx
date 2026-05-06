import type { HookDiagnosticsMeta, HookResponseMeta, HookStartedMeta } from '@/types/ui';
import { cn } from '@/utils/cn';
import { renderIcon } from './message-type-icons.tsx';
import { CODE_BLOCK_CLASS, CollapsibleBlock, StatusLine } from './primitives.tsx';

export function HookStartedContent({
  content,
  meta,
}: {
  content: string;
  meta?: HookStartedMeta;
}): React.JSX.Element {
  return (
    <StatusLine icon={renderIcon('hook_started')} className="text-text-muted">
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
      <StatusLine icon={renderIcon('hook_response')} className="text-text-muted">
        <span>Hook done: {content}</span>
      </StatusLine>
    );
  return (
    <CollapsibleBlock icon={renderIcon('hook_response')} label={`Hook done: ${content}`}>
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
    <CollapsibleBlock
      icon={renderIcon('hook_diagnostics', 'w-4 h-4 shrink-0 text-warning')}
      label={`Hook Diagnostics: ${content}`}
    >
      <pre className={cn(CODE_BLOCK_CLASS, 'whitespace-pre-wrap')}>{diagnostics ?? content}</pre>
    </CollapsibleBlock>
  );
}

import { cn } from '@/utils/cn';
import { CODE_BLOCK_CLASS, CollapsibleBlock, StatusLine } from '../renderers/primitives.tsx';
import { renderIcon } from './message-type-icons.tsx';

export function HookStartedContent({
  content,
  hookEvent,
}: {
  content: string;
  hookEvent?: string;
}): React.JSX.Element {
  return (
    <StatusLine icon={renderIcon('hook_started')} className="text-text-muted">
      <span>Running hook: {content}</span>
      {hookEvent ? <span className="text-text-muted/60">({hookEvent})</span> : null}
    </StatusLine>
  );
}

export function HookResponseContent({
  content,
  output,
}: {
  content: string;
  output?: string;
}): React.JSX.Element {
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
  diagnostics,
}: {
  content: string;
  diagnostics?: string;
}): React.JSX.Element {
  return (
    <CollapsibleBlock
      icon={renderIcon('hook_diagnostics', 'w-4 h-4 shrink-0 text-warning')}
      label={`Hook Diagnostics: ${content}`}
    >
      <pre className={cn(CODE_BLOCK_CLASS, 'whitespace-pre-wrap')}>{diagnostics ?? content}</pre>
    </CollapsibleBlock>
  );
}

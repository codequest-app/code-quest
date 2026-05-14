import { cn } from '@/utils/cn';
import { CODE_BLOCK_CLASS } from '../renderers/ansi.tsx';
import { CollapsibleBlock } from '../ui/CollapsibleBlock';
import { renderIcon } from './message-type-icons.tsx';

function StatusLine({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span className="inline-flex items-center">{icon}</span>
      {children}
    </div>
  );
}

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
      {hookEvent ? <span className="text-subtle">({hookEvent})</span> : null}
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
      <pre className={cn(CODE_BLOCK_CLASS, 'text-subtle')}>{output}</pre>
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

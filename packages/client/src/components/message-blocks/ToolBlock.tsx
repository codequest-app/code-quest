import { cn } from '../../utils/cn';
import { CopyButton } from './CopyButton';

export function ToolBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-code-block overflow-hidden text-xs font-mono group/tool-block">
      {children}
    </div>
  );
}

export function ToolBlockRow({
  label,
  children,
  copyText,
  divider,
  className,
}: {
  label: string;
  children: React.ReactNode;
  copyText?: string;
  divider?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn('flex items-baseline gap-3', divider && 'border-b border-border', className)}
    >
      <span className="text-xs font-mono text-text-muted/60 select-none shrink-0 pl-3 py-2 min-w-14">
        {label}
      </span>
      <div className="flex-1 min-w-0 overflow-x-auto py-2">{children}</div>
      {copyText && (
        <CopyButton
          text={copyText}
          className="px-2 py-2 shrink-0 opacity-0 group-hover/tool-block:opacity-100 transition-opacity text-text-muted hover:text-text hover:bg-surface-hover rounded self-start"
        />
      )}
    </div>
  );
}

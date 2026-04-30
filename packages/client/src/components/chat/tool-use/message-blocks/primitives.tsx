import * as Collapsible from '@radix-ui/react-collapsible';
import Ansi from 'ansi-to-react';
import { copyToClipboard } from '../../../../utils/clipboard';
import { cn } from '../../../../utils/cn';

export function RotatableChevron({
  open,
  className,
}: {
  open?: boolean;
  className?: string;
}): React.JSX.Element {
  return <span className={cn('transition-transform', open && 'rotate-90', className)}>▶</span>;
}

export const CODE_BLOCK_CLASS =
  'bg-code-block p-3 rounded-lg overflow-x-auto text-xs font-mono border border-border';

export function CollapsibleBlock({
  icon,
  label,
  labelDetail,
  labelRange,
  defaultOpen,
  children,
}: {
  icon: string;
  label: string;
  labelDetail?: string;
  labelRange?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Collapsible.Root defaultOpen={defaultOpen ?? false}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 cursor-pointer select-none text-sm text-text-muted hover:text-text transition-colors py-1"
        >
          <span>{icon}</span>
          <span className="font-semibold text-text-bright">{label}</span>
          {labelDetail && <span className="opacity-70 truncate max-w-75">{labelDetail}</span>}
          {labelRange && <span className="opacity-50 text-xs">{labelRange}</span>}
          <span className="text-xs opacity-50 transition-transform group-data-[state=open]:rotate-90">
            ▶
          </span>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="mt-2 pl-6">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function StatusLine({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span>{icon}</span>
      {children}
    </div>
  );
}

export function CenterDivider({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-2 text-text-muted/40 text-xs" {...props}>
      <div className="flex-1 border-t border-text-muted/20" />
      {children}
      <div className="flex-1 border-t border-text-muted/20" />
    </div>
  );
}

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(0x1b)}\\[[\\d;]*m`);

export function hasAnsi(content: string): boolean {
  return ANSI_PATTERN.test(content);
}

export function AnsiContent({ content }: { content: string }): React.JSX.Element {
  return (
    <section aria-label="ansi-content">
      <pre className={CODE_BLOCK_CLASS}>
        <Ansi>{content}</Ansi>
      </pre>
    </section>
  );
}

const FILE_PATH_PATTERN = /(?:^|\s)((?:\/|\.\/|\.\.\/)[^\s:]+(?::\d+)?)/g;

export function OutputContent({
  content,
  isError,
}: {
  content: string;
  isError?: boolean;
}): React.JSX.Element {
  return hasAnsi(content) ? (
    <AnsiContent content={content} />
  ) : (
    <pre className={cn('whitespace-pre-wrap', isError && 'text-danger')}>
      {parseFilePathsInContent(content)}
    </pre>
  );
}

export function parseFilePathsInContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(FILE_PATH_PATTERN)) {
    const path = match[1];
    if (!path) continue;
    const start = match.index + (match[0].length - path.length);
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(
      <button
        key={start}
        type="button"
        onClick={() => copyToClipboard(path)}
        className="text-accent hover:underline cursor-pointer"
        title={`Copy: ${path}`}
      >
        {path}
      </button>,
    );
    lastIndex = start + path.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : [text];
}

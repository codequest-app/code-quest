import Ansi from 'ansi-to-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

export const CODE_BLOCK_CLASS =
  'bg-code-block p-3 rounded-lg overflow-x-auto text-[13px] font-mono border border-border';

export function CollapsibleBlock({
  icon,
  label,
  labelDetail,
  labelRange,
  children,
}: {
  icon: string;
  label: string;
  labelDetail?: string;
  labelRange?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 cursor-pointer select-none text-sm text-text-muted hover:text-text transition-colors py-1"
      >
        <span>{icon}</span>
        <span className="font-semibold text-text-bright">{label}</span>
        {labelDetail && <span className="opacity-70 truncate max-w-[300px]">{labelDetail}</span>}
        {labelRange && <span className="opacity-50 text-xs">{labelRange}</span>}
        <span className={cn('text-xs opacity-50 transition-transform', open && 'rotate-90')}>
          ▶
        </span>
      </button>
      {open && <div className="mt-2 pl-6">{children}</div>}
    </div>
  );
}

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(0x1b)}\\[[\\d;]*m`);

export function hasAnsi(content: string): boolean {
  return ANSI_PATTERN.test(content);
}

export function AnsiContent({ content }: { content: string }) {
  return (
    <pre data-testid="ansi-content" className={CODE_BLOCK_CLASS}>
      <Ansi>{content}</Ansi>
    </pre>
  );
}

const FILE_PATH_PATTERN = /(?:^|\s)((?:\/|\.\/|\.\.\/)[^\s:]+(?::\d+)?)/g;

export function parseFilePathsInContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(FILE_PATH_PATTERN.source, FILE_PATH_PATTERN.flags);

  for (const match of text.matchAll(regex)) {
    const path = match[1];
    const start = match.index + (match[0].length - path.length);
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(
      <button
        key={start}
        type="button"
        onClick={() => navigator.clipboard.writeText(path)}
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

import AnsiModule from 'ansi-to-react';
import { copyToClipboard } from '@/utils/clipboard';
import { cn } from '@/utils/cn';

const Ansi =
  typeof AnsiModule === 'function'
    ? AnsiModule
    : (AnsiModule as { default: typeof AnsiModule }).default;

export const CODE_BLOCK_CLASS =
  'bg-code-block p-3 rounded-lg overflow-x-auto text-xs font-mono border border-border';

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequence requires literal ESC char
const ANSI_PATTERN = /\x1b\[[\d;]*m/;

export function hasAnsi(content: string): boolean {
  return ANSI_PATTERN.test(content);
}

export function AnsiContent({
  content,
  bare,
}: {
  content: string;
  bare?: boolean;
}): React.JSX.Element {
  return (
    <section aria-label="ansi-content">
      <pre className={bare ? 'whitespace-pre-wrap font-mono text-xs' : CODE_BLOCK_CLASS}>
        <Ansi>{content}</Ansi>
      </pre>
    </section>
  );
}

const FILE_PATH_PATTERN = /(?:^|\s)((?:\/|\.\/|\.\.\/)[^\s:]+(?::\d+)?)/g;

export function renderFilePathsWithCopyButtons(text: string): React.ReactNode[] {
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
      {renderFilePathsWithCopyButtons(content)}
    </pre>
  );
}

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../utils/cn';
import { CodeBlock } from './CodeBlock';
import { CopyButton, HOVER_COPY_BASE } from './message-blocks/CopyButton';

function isElementWithLanguageClass(node: React.ReactNode): boolean {
  if (!node || typeof node !== 'object') return false;
  const el = node as { props?: { className?: string; children?: React.ReactNode } };
  const className = el.props?.className;
  if (typeof className === 'string' && /language-\w+/.test(className)) return true;
  return false;
}

function FencedCodeWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  return (
    <div className="relative group/code">
      <CopyButton
        getText={() => ref.current?.textContent ?? ''}
        className={cn(
          HOVER_COPY_BASE,
          'absolute top-2 right-2 z-sticky group-hover/code:opacity-100',
        )}
        title="Copy"
      />
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

function LinkWithContextMenu({ href, children }: { href?: string; children: React.ReactNode }) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  if (!href) return <span>{children}</span>;
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {children}
      </a>
      {menu &&
        createPortal(
          <div
            role="menu"
            className="fixed z-modal bg-surface border border-border rounded shadow"
            style={{ left: menu.x, top: menu.y }}
            onMouseLeave={() => setMenu(null)}
          >
            <button
              type="button"
              className="block px-3 py-1 text-sm text-text hover:bg-surface-hover w-full text-left"
              onClick={() => {
                navigator.clipboard.writeText(href);
                setMenu(null);
              }}
            >
              Copy Link
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

const components: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const code = String(children).replace(/\n$/, '');
    if (match?.[1]) {
      return <CodeBlock code={code} language={match[1]} className={className} />;
    }
    return <code className={className}>{children}</code>;
  },
  pre({ children }) {
    // When inner <code> has a language class, react-markdown already rendered
    // a CodeBlock (which owns its own <pre> layout + copy button).
    // Pass it through untouched to avoid double wrappers + duplicate copy.
    if (isElementWithLanguageClass(children)) return <>{children}</>;
    return <FencedCodeWrapper>{children}</FencedCodeWrapper>;
  },
  a({ href, children }) {
    return (
      <LinkWithContextMenu href={typeof href === 'string' ? href : undefined}>
        {children}
      </LinkWithContextMenu>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3 rounded-lg border border-border">
        <table className="min-w-full text-sm border-collapse">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead className="bg-surface-hover border-b border-border text-text-bright">{children}</thead>
    );
  },
  th({ children, style }) {
    return (
      <th
        className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
        style={style}
      >
        {children}
      </th>
    );
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-border">{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>;
  },
  td({ children, style }) {
    return (
      <td className="px-3 py-2 whitespace-pre-wrap break-words" style={style}>
        {children}
      </td>
    );
  },
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-themed prose-sm max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}

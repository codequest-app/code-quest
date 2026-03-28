import type { Components } from 'react-markdown';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

const components: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const code = String(children).replace(/\n$/, '');
    return <CodeBlock code={code} language={match?.[1]} className={className} />;
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
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </Markdown>
  );
}

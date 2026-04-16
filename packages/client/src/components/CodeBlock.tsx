import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyButton } from './message-blocks/CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  if (!language) {
    return <code className={className}>{code}</code>;
  }

  return (
    <div className="relative group/code">
      <CopyButton
        text={code}
        className="absolute top-2 right-2 p-1 rounded text-text-muted hover:text-text hover:bg-surface-hover opacity-0 group-hover/code:opacity-100 transition-opacity cursor-pointer"
      />
      <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

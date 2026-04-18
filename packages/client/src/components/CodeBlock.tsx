import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../utils/cn';
import { CopyButton, HOVER_COPY_BASE } from './message-blocks/CopyButton';

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
        className={cn(HOVER_COPY_BASE, 'absolute top-2 right-2 group-hover/code:opacity-100')}
      />
      <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

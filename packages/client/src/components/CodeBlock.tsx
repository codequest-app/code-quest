import { useEffect, useState } from 'react';
import { HighlightedCode } from '../utils/shiki';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!language) {
    return <code className={className}>{code}</code>;
  }

  return (
    <div className="relative group/code">
      <button
        type="button"
        aria-label="Copy code"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        }}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-surface-hover text-text-muted hover:text-text opacity-0 group-hover/code:opacity-100 transition-opacity cursor-pointer"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <HighlightedCode
        code={code}
        language={language}
        className="[&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:text-sm"
      />
    </div>
  );
}

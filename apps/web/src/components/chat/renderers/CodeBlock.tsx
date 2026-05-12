import { Copyable } from './Copyable.tsx';
import { Highlight } from './Highlight.tsx';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  wrapLongLines?: boolean;
}

export function CodeBlock({
  code,
  language,
  className,
  wrapLongLines,
}: CodeBlockProps): React.JSX.Element {
  if (!language) {
    return <code className={className}>{code}</code>;
  }

  return (
    <Copyable text={code}>
      <Highlight lang={language} wrap={wrapLongLines}>
        {code}
      </Highlight>
    </Copyable>
  );
}

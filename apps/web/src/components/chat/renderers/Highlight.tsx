import { langForPath } from '@code-quest/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffectiveColorTheme } from '@/hooks/useEffectiveColorTheme';
import { Pre } from './Pre.tsx';

interface HighlightProps {
  children: string;
  lang?: string;
  filePath?: string;
  wrap?: boolean;
}

export function Highlight({
  children,
  lang,
  filePath,
  wrap = true,
}: HighlightProps): React.JSX.Element {
  const effective = useEffectiveColorTheme();
  const style = effective === 'light' ? oneLight : vscDarkPlus;

  const resolvedLang = lang ?? (filePath ? langForPath(filePath) : undefined);

  if (!resolvedLang) {
    return <Pre>{children}</Pre>;
  }

  return (
    <SyntaxHighlighter
      style={style}
      language={resolvedLang}
      PreTag="div"
      wrapLongLines={wrap}
      customStyle={{ padding: 0, margin: 0, background: 'transparent' }}
    >
      {children}
    </SyntaxHighlighter>
  );
}

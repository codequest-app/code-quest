import { useEffect, useState } from 'react';
import { createHighlighter } from 'shiki';

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [],
    });
  }
  return highlighterPromise;
}

async function highlight(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();
  const loadedLangs = highlighter.getLoadedLanguages();
  if (!loadedLangs.includes(lang)) {
    try {
      await highlighter.loadLanguage(lang as Parameters<Highlighter['loadLanguage']>[0]);
    } catch {
      return escapeHtml(code);
    }
  }
  return highlighter.codeToHtml(code, { lang, theme: 'github-dark' });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface HighlightedCodeProps {
  code: string;
  language: string;
  className?: string;
}

export function HighlightedCode({ code, language, className }: HighlightedCodeProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlight(code, language).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre className={className}>
        <code>{code}</code>
      </pre>
    );
  }

  // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki codeToHtml output is sanitized
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

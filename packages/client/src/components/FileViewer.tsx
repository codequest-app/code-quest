import { useCallback, useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  rb: 'ruby',
  java: 'java',
  css: 'css',
  html: 'html',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
  xml: 'xml',
  toml: 'toml',
};

function detectLanguage(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext ? EXT_TO_LANG[ext] : undefined;
}

interface FileViewerProps {
  filePath: string;
  content?: string;
  error?: string;
  loading?: boolean;
}

export function FileViewer({ filePath, content, error, loading }: FileViewerProps) {
  const fileName = filePath.split('/').pop() ?? filePath;
  const language = detectLanguage(filePath);

  if (loading) {
    return (
      <div className="rounded border border-border bg-surface p-4">
        <div className="text-sm text-text-muted">Loading {fileName}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-border-error bg-surface p-4">
        <div className="text-sm font-medium text-text-error">{fileName}</div>
        <div className="text-sm text-text-muted mt-1">{error}</div>
      </div>
    );
  }

  if (content == null) return null;

  return (
    <div className="rounded border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-hover border-b border-border">
        <span className="text-xs text-text-muted font-mono">{filePath}</span>
        {language && <span className="text-xs text-text-muted">{language}</span>}
      </div>
      <div className="max-h-[500px] overflow-auto text-sm">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language ?? 'text'}
          showLineNumbers
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0 }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

interface FileViewerConnectedProps {
  filePath: string;
  emit: (event: string, ...args: unknown[]) => void;
}

export function FileViewerConnected({ filePath, emit }: FileViewerConnectedProps) {
  const [state, setState] = useState<{ content?: string; error?: string; loading: boolean }>({
    loading: true,
  });

  const fetchFile = useCallback(() => {
    setState({ loading: true });
    emit('file:read', { filePath }, (res: unknown) => {
      const r = res as { content?: string; error?: string };
      if (r.error) {
        setState({ error: r.error, loading: false });
      } else {
        setState({ content: r.content, loading: false });
      }
    });
  }, [emit, filePath]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  return <FileViewer filePath={filePath} {...state} />;
}

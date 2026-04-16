import { fileReadResponseSchema } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { langFromPath } from '../utils/syntax';

interface FileViewerProps {
  filePath: string;
  content?: string;
  error?: string;
  loading?: boolean;
}

export function FileViewer({ filePath, content, error, loading }: FileViewerProps) {
  const fileName = filePath.split('/').pop() ?? filePath;
  const language = langFromPath(filePath);

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

  useEffect(() => {
    setState({ loading: true });
    emit('file:read', { filePath }, (res: unknown) => {
      const parsed = fileReadResponseSchema.safeParse(res);
      if (!parsed.success) {
        setState({ error: 'Invalid response', loading: false });
        return;
      }
      if ('error' in parsed.data) {
        setState({ error: parsed.data.error, loading: false });
      } else {
        setState({ content: parsed.data.content, loading: false });
      }
    });
  }, [emit, filePath]);

  return <FileViewer filePath={filePath} {...state} />;
}

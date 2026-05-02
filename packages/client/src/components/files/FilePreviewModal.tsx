import { EVENTS, fsReadResponseSchema } from '@code-quest/shared';
import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { rpc } from '@/socket/rpc';
import { CodeBlock } from '../chat/renderers/CodeBlock.tsx';
import { Button } from '../ui/Button.tsx';
import { Dialog, DialogContent } from '../ui/Dialog.tsx';

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  md: 'markdown',
  html: 'html',
  css: 'css',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'bash',
  py: 'python',
};

function languageFor(path: string): string | undefined {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext ? EXT_TO_LANG[ext] : undefined;
}

/** UTF-16 code units, not bytes — `string.length`. Files this big take
 *  hundreds of ms to syntax-highlight, which is what we actually want to
 *  guard against. The "500 KB" UI label is a pragmatic approximation. */
const PREVIEW_CHAR_LIMIT = 500 * 1024;

export interface FilePreviewModalProps {
  path: string;
  onClose: () => void;
  onMention: (path: string) => void;
}

export function FilePreviewModal({
  path,
  onClose,
  onMention,
}: FilePreviewModalProps): React.JSX.Element {
  const language = useMemo(() => languageFor(path), [path]);
  const { socket } = useSocket();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'ready'; content: string }
    | { kind: 'too-large' }
    | { kind: 'error'; message: string }
  >({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      const response = await rpc(socket, EVENTS.fs.read, { path });
      if (cancelled) return;
      const parsed = fsReadResponseSchema.safeParse(response);
      if (!parsed.success) {
        setState({ kind: 'error', message: 'Read failed' });
        return;
      }
      if ('error' in parsed.data) {
        setState({ kind: 'error', message: parsed.data.error });
        return;
      }
      const { content } = parsed.data;
      if (content.length > PREVIEW_CHAR_LIMIT) {
        setState({ kind: 'too-large' });
        return;
      }
      setState({ kind: 'ready', content });
    })();
    return () => {
      cancelled = true;
    };
  }, [path, socket]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={path} size="lg">
        <div className="flex flex-col gap-3">
          <PreviewBody state={state} language={language} />
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="primary" size="sm" onClick={() => onMention(path)}>
              Mention
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(path);
              }}
            >
              Copy path
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  state,
  language,
}: {
  state:
    | { kind: 'loading' }
    | { kind: 'ready'; content: string }
    | { kind: 'too-large' }
    | { kind: 'error'; message: string };
  language?: string;
}) {
  if (state.kind === 'loading') {
    return <div className="text-sm text-text-muted">Loading…</div>;
  }
  if (state.kind === 'too-large') {
    return <div className="text-sm text-text-muted">File too large to preview (over 500 KB).</div>;
  }
  if (state.kind === 'error') {
    return <div className="text-sm text-warn">{state.message}</div>;
  }
  if (language) {
    return (
      <div className="overflow-auto max-h-dialog-body text-xs">
        <CodeBlock code={state.content} language={language} />
      </div>
    );
  }
  return <NumberedPlaintext content={state.content} />;
}

function NumberedPlaintext({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="bg-bg/40 border border-border rounded overflow-auto max-h-dialog-body font-mono text-xs leading-relaxed">
      <table className="w-full">
        <tbody>
          {lines.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: line order is fixed for this static render
            <tr key={i}>
              <td className="text-text-dim text-right pr-3 pl-2 select-none w-10 align-top">
                {i + 1}
              </td>
              <td className="whitespace-pre pr-2 align-top">{line || ' '}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

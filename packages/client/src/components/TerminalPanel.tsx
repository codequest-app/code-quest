import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChannelMessages } from '../contexts/channel';

function XtermView({ lines }: { lines: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const linesLenRef = useRef(0);
  const initialLinesRef = useRef(lines);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = new Terminal({
      disableStdin: true,
      theme: { background: 'transparent' },
      fontSize: 12,
      scrollback: 1000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    for (const line of initialLinesRef.current) {
      term.writeln(line);
    }
    linesLenRef.current = initialLinesRef.current.length;
    termRef.current = term;
    return () => term.dispose();
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const newLines = lines.slice(linesLenRef.current);
    for (const line of newLines) {
      term.writeln(line);
    }
    linesLenRef.current = lines.length;
  }, [lines]);

  return <div ref={containerRef} className="flex-1 min-h-0" />;
}

export function TerminalPanel() {
  const { terminalSessions, getTerminalContents, openClaudeTerminal } = useChannelMessages();
  const sessionList = Object.values(terminalSessions);
  const activeSession = sessionList[sessionList.length - 1];
  const [clearedLines, setClearedLines] = useState(0);

  const handleCopy = async () => {
    if (!activeSession) return;
    const text = activeSession.outputLines.slice(clearedLines).join('\n');
    await navigator.clipboard.writeText(text);
    toast.success('Terminal output copied');
  };

  const handleClear = () => {
    setClearedLines(activeSession?.outputLines.length ?? 0);
  };

  const handleGetContents = async () => {
    if (!activeSession) return;
    const res = await getTerminalContents();
    if (res.content === null) {
      toast.error('No terminal content available');
    } else {
      await navigator.clipboard.writeText(res.content);
      toast.success('Terminal contents copied to clipboard');
    }
  };

  const handleOpenClaude = async () => {
    const res = await openClaudeTerminal();
    if (res.success) {
      toast.success('New Claude terminal opened');
    } else {
      toast.error(res.error ?? 'Failed to open Claude terminal');
    }
  };

  const visibleLines = activeSession?.outputLines.slice(clearedLines) ?? [];

  return (
    <div className="flex flex-col bg-surface border-r border-border h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium text-text">{activeSession?.title ?? 'Terminal'}</span>
        <div className="flex items-center gap-2">
          {activeSession && (
            <>
              <button
                type="button"
                title="Get terminal contents"
                onClick={handleGetContents}
                className="text-text-muted hover:text-text text-xs transition-colors"
              >
                Get Contents
              </button>
              <button
                type="button"
                title="Copy output"
                onClick={handleCopy}
                className="text-text-muted hover:text-text text-xs transition-colors"
              >
                Copy
              </button>
              <button
                type="button"
                title="Clear"
                onClick={handleClear}
                className="text-text-muted hover:text-text text-xs transition-colors"
              >
                Clear
              </button>
            </>
          )}
          <button
            type="button"
            title="Open Claude in terminal"
            onClick={handleOpenClaude}
            className="text-text-muted hover:text-text text-xs transition-colors"
          >
            Open Claude
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col p-2 font-mono overflow-hidden">
        {activeSession ? (
          <XtermView lines={visibleLines} />
        ) : (
          <p className="text-xs text-text-muted px-1">No terminal session.</p>
        )}
      </div>
    </div>
  );
}

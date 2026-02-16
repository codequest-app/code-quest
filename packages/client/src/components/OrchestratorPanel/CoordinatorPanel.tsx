import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../../stores/chatStore.ts';

interface CoordinatorPanelProps {
  coordinatorId: string;
}

export function CoordinatorPanel({ coordinatorId }: CoordinatorPanelProps) {
  const session = useChatStore((state) => state.chatSessions.get(coordinatorId));
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = session?.messages ?? [];
  const assistantContent = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n\n');

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when content changes
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [assistantContent]);

  return (
    <div className="coordinator-panel" ref={containerRef} data-testid="coordinator-panel">
      {assistantContent ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{assistantContent}</ReactMarkdown>
      ) : (
        <div style={{ color: '#808080', fontStyle: 'italic' }}>Waiting for synthesis...</div>
      )}
    </div>
  );
}

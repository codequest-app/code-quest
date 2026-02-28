import { useEffect } from 'react';
import { useChat } from '../hooks/use-chat';
import type { TypedSocket } from '../socket/client';
import { useChatStore } from '../stores/chat-store';
import { ChatInput } from './ChatInput';
import { ControlRequestBanner } from './ControlRequestBanner';
import { HeaderBar } from './HeaderBar';
import { MessageList } from './MessageList';
import { StatsBar } from './StatsBar';

interface ChatPanelProps {
  socket: TypedSocket;
}

export function ChatPanel({ socket }: ChatPanelProps) {
  const { createSession, sendMessage, respondToControl } = useChat(socket);
  const messages = useChatStore((s) => s.messages);
  const status = useChatStore((s) => s.status);
  const sessionId = useChatStore((s) => s.sessionId);
  const pendingControl = useChatStore((s) => s.pendingControl);
  const stats = useChatStore((s) => s.stats);

  useEffect(() => {
    createSession();
  }, [createSession]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <HeaderBar status={status} sessionId={sessionId} />
      <MessageList messages={messages} />
      <div className="shrink-0 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
          <ControlRequestBanner pending={pendingControl} onRespond={respondToControl} />
          <ChatInput onSend={sendMessage} disabled={status === 'processing'} />
          <StatsBar stats={stats} />
        </div>
      </div>
    </div>
  );
}

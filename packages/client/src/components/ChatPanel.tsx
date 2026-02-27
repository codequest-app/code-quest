import { useEffect } from 'react';
import { useChat } from '../hooks/use-chat';
import type { TypedSocket } from '../socket/client';
import { useChatStore } from '../stores/chat-store';
import { ChatInput } from './ChatInput';
import { ControlRequestBanner } from './ControlRequestBanner';
import { MessageList } from './MessageList';
import { StatsBar } from './StatsBar';

interface ChatPanelProps {
  socket: TypedSocket;
}

export function ChatPanel({ socket }: ChatPanelProps) {
  const { createSession, sendMessage, respondToControl } = useChat(socket);
  const messages = useChatStore((s) => s.messages);
  const status = useChatStore((s) => s.status);
  const pendingControl = useChatStore((s) => s.pendingControl);
  const stats = useChatStore((s) => s.stats);

  useEffect(() => {
    createSession();
  }, [createSession]);

  return (
    <div className="flex flex-col h-full max-w-[900px] mx-auto w-full">
      <MessageList messages={messages} />
      <ControlRequestBanner pending={pendingControl} onRespond={respondToControl} />
      <StatsBar stats={stats} />
      <ChatInput onSend={sendMessage} disabled={status === 'processing'} />
    </div>
  );
}

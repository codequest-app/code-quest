import { useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  sessionId: string;
  serverUrl?: string;
  onSend?: (sessionId: string, message: string) => void;
  onAbort?: (sessionId: string) => void;
}

export function ChatPanel({ sessionId, onSend, onAbort }: ChatPanelProps) {
  const session = useChatStore((state) => state.getChatSession(sessionId));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [session?.messages.length, session?.messages[session.messages.length - 1]?.content]);

  if (!session) {
    return (
      <div className="chat-panel" data-testid="chat-panel">
        <div className="chat-empty">Session not found</div>
      </div>
    );
  }

  return (
    <div className="chat-panel" data-testid="chat-panel">
      <div className="chat-messages">
        {session.messages.length === 0 && (
          <div className="chat-empty">
            Start a conversation by typing a message below.
          </div>
        )}
        {session.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={(message) => onSend?.(sessionId, message)}
        onAbort={() => onAbort?.(sessionId)}
        isProcessing={session.isProcessing}
      />

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          color: #d4d4d4;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c6c6c;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

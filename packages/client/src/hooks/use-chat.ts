import type { ChatStreamEvent } from '@code-quest/shared';
import { useCallback, useEffect, useRef } from 'react';
import type { TypedSocket } from '../socket/client';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types/ui';

const msg = (fields: Omit<Message, 'id' | 'timestamp'>): Message => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  ...fields,
});

export function useChat(socket: TypedSocket) {
  const streamingText = useRef(false);
  const streamingThinking = useRef(false);

  useEffect(() => {
    const store = () => useChatStore.getState();

    const onConnect = () => store().setStatus('idle');
    const onDisconnect = () => store().setStatus('disconnected');

    const onEvent = ({ event }: { sessionId: string; event: ChatStreamEvent }) => {
      switch (event.type) {
        case 'text':
        case 'text_delta':
          streamingThinking.current = false;
          if (streamingText.current) {
            store().appendToLastMessage(event.content);
          } else {
            streamingText.current = true;
            store().addMessage(msg({ role: 'assistant', type: 'text', content: event.content }));
          }
          break;

        case 'thinking_delta':
          if (streamingThinking.current) {
            store().appendToLastMessage(event.content);
          } else {
            streamingThinking.current = true;
            streamingText.current = false;
            store().addMessage(
              msg({ role: 'assistant', type: 'thinking', content: event.content }),
            );
          }
          break;

        case 'message_end':
          streamingText.current = false;
          streamingThinking.current = false;
          break;

        case 'init':
          store().setModel(event.model ?? null);
          store().setTools(event.tools ?? []);
          break;

        case 'status':
          store().setStatusText(event.message);
          break;

        case 'thinking':
          streamingText.current = false;
          streamingThinking.current = false;
          store().addMessage(msg({ role: 'assistant', type: 'thinking', content: event.content }));
          break;

        case 'tool_use':
          streamingText.current = false;
          streamingThinking.current = false;
          store().addMessage(
            msg({
              role: 'assistant',
              type: 'tool_use',
              content: event.name,
              meta: { toolId: event.id, input: event.input },
            }),
          );
          break;

        case 'tool_result':
          streamingText.current = false;
          streamingThinking.current = false;
          store().addMessage(
            msg({
              role: 'assistant',
              type: 'tool_result',
              content: event.output,
              meta: { toolId: event.id, name: event.name },
            }),
          );
          break;

        case 'result':
          streamingText.current = false;
          streamingThinking.current = false;
          store().setStats(event.stats);
          store().setStatusText(null);
          store().setStatus('idle');
          break;

        case 'error':
          streamingText.current = false;
          streamingThinking.current = false;
          store().addMessage(msg({ role: 'system', type: 'error', content: event.message }));
          store().setStatus('idle');
          break;

        case 'control_request':
          streamingText.current = false;
          streamingThinking.current = false;
          store().setPendingControl({
            requestId: event.requestId,
            subtype: event.subtype,
            toolName: event.toolName,
            input: event.input,
          });
          store().addMessage(
            msg({
              role: 'assistant',
              type: 'control_request',
              content: event.toolName ?? event.subtype,
              meta: { requestId: event.requestId, input: event.input },
            }),
          );
          break;
      }
    };

    const onError = ({ message }: { message: string }) => {
      store().addMessage(msg({ role: 'system', type: 'error', content: message }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:event', onEvent);
    socket.on('chat:error', onError);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:event', onEvent);
      socket.off('chat:error', onError);
    };
  }, [socket]);

  const createSession = useCallback(() => {
    socket.emit('chat:create', {}, ({ sessionId }) => {
      const store = useChatStore.getState();
      store.setSessionId(sessionId);
      store.setStatus('idle');
    });
  }, [socket]);

  const sendMessage = useCallback(
    (message: string) => {
      const { sessionId, addMessage, setStatus } = useChatStore.getState();
      if (!sessionId) return;

      addMessage(msg({ role: 'user', type: 'text', content: message }));
      setStatus('processing');
      streamingText.current = false;
      streamingThinking.current = false;
      socket.emit('chat:send', { sessionId, message });
    },
    [socket],
  );

  const abort = useCallback(() => {
    const { sessionId } = useChatStore.getState();
    if (sessionId) {
      socket.emit('chat:abort', { sessionId });
    }
  }, [socket]);

  const respondToControl = useCallback(
    (response: Record<string, unknown>) => {
      const { sessionId, pendingControl, setPendingControl } = useChatStore.getState();
      if (!sessionId || !pendingControl) return;

      socket.emit('chat:control_response', {
        sessionId,
        requestId: pendingControl.requestId,
        response,
      });
      setPendingControl(null);
    },
    [socket],
  );

  return { createSession, sendMessage, abort, respondToControl };
}

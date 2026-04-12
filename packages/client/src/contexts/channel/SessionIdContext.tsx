import { sessionInitPayloadSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSocket } from '../SocketContext';

export const SessionIdContext = createContext<string | null>(null);

export function useSessionId(): string | null {
  return useContext(SessionIdContext);
}

export function SessionIdProvider({
  channelId,
  children,
}: {
  channelId: string;
  children: ReactNode;
}) {
  const { socket } = useSocket();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    function onSessionInit(raw: unknown) {
      const parsed = sessionInitPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      if (parsed.data.channelId !== channelId) return;
      setSessionId(parsed.data.sessionId);
    }
    socket.on('session:init', onSessionInit);
    return () => {
      socket.off('session:init', onSessionInit);
    };
  }, [socket, channelId]);

  return <SessionIdContext.Provider value={sessionId}>{children}</SessionIdContext.Provider>;
}

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import type { TypedSocket } from '../socket/client';

interface SocketContextValue {
  socket: TypedSocket;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}

export function SocketProvider({ socket, children }: { socket: TypedSocket; children: ReactNode }) {
  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

import { createContext, type ReactNode, useContext } from 'react';
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

export function SocketProvider({
  socket,
  children,
}: {
  socket: TypedSocket;
  children: ReactNode;
}): React.JSX.Element {
  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
}

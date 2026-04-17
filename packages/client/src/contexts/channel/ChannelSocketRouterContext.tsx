import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { useChannelId } from './ChannelIdContext';
import { ChannelSocketRouter, createSocketAdapter } from './socket-router';

const Context = createContext<ChannelSocketRouter | null>(null);

export function ChannelSocketRouterProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const channelId = useChannelId();

  const router = new ChannelSocketRouter(createSocketAdapter(socket), channelId);

  useEffect(() => () => router.dispose(), [router]);

  return <Context.Provider value={router}>{children}</Context.Provider>;
}

export function useChannelSocketRouter(): ChannelSocketRouter {
  const router = useContext(Context);
  if (!router) {
    throw new Error('useChannelSocketRouter must be used within ChannelSocketRouterProvider');
  }
  return router;
}

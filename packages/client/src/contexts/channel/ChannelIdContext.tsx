import { createContext, type ReactNode, useContext } from 'react';

export const ChannelIdContext = createContext<string | null>(null);

export function useChannelId(): string {
  const channelId = useContext(ChannelIdContext);
  if (channelId === null) {
    throw new Error('useChannelId must be used within a ChannelIdContext provider');
  }
  return channelId;
}

export function ChannelIdProvider({
  channelId,
  children,
}: {
  channelId: string;
  children: ReactNode;
}) {
  return <ChannelIdContext.Provider value={channelId}>{children}</ChannelIdContext.Provider>;
}

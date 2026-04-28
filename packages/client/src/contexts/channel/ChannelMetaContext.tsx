import { createContext, type ReactNode, useContext, useMemo } from 'react';

interface ChannelMeta {
  channelId: string;
  /** Working directory of the channel's session. Optional — historical
   *  channels (resumed before cwd was persisted) can land without it. */
  cwd?: string;
}

const ChannelMetaContext = createContext<ChannelMeta | null>(null);

export function useChannelMeta(): ChannelMeta {
  const meta = useContext(ChannelMetaContext);
  if (meta === null) {
    throw new Error('useChannelMeta must be used within a ChannelMetaProvider');
  }
  return meta;
}

/** Backwards-compatible selector — many existing call sites only need
 *  channelId. Reading via meta avoids touching them when cwd is added. */
export function useChannelId(): string {
  return useChannelMeta().channelId;
}

export function ChannelMetaProvider({
  channelId,
  cwd,
  children,
}: {
  channelId: string;
  cwd?: string;
  children: ReactNode;
}): React.JSX.Element {
  // Memoize so context consumers don't re-render on every parent render —
  // only when channelId or cwd actually changes.
  const value = useMemo<ChannelMeta>(() => ({ channelId, cwd }), [channelId, cwd]);
  return <ChannelMetaContext.Provider value={value}>{children}</ChannelMetaContext.Provider>;
}

import { useContext } from 'react';
import { ChannelMetaContext } from '@/contexts/channel/ChannelMetaContext';
import type { ChannelState } from '@/types/chat';
import { initialChannelState } from '@/types/chat';
import { useChannelsStore } from './channels-store.ts';

const FALLBACK_STATE = initialChannelState('__fallback__');

export function useChannelStore<T>(selector: (s: ChannelState) => T): T {
  const meta = useContext(ChannelMetaContext);
  const channelId = meta?.channelId;
  return useChannelsStore((s) => {
    if (!channelId) return selector(FALLBACK_STATE);
    return selector(s.channels.get(channelId) ?? FALLBACK_STATE);
  });
}

export function selectIsActive(s: ChannelState): boolean {
  return s.status === 'processing' || s.status === 'busy' || s.status === 'cancelling';
}

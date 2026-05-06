import type { ChannelState } from '@/types/chat';

export function shouldApplyBatch(
  replayIdRef: { current: string | null },
  replayId: string,
): boolean {
  if (replayIdRef.current === null) {
    replayIdRef.current = replayId;
    return true;
  }
  return replayIdRef.current === replayId;
}

export function applyHistoryBatch(
  state: ChannelState,
  events: Array<{ name: string; payload: unknown }>,
  handlers: Record<string, (s: ChannelState, p: unknown) => ChannelState>,
): ChannelState {
  return events.reduce((s, event) => {
    const handler = handlers[event.name];
    return handler ? handler(s, event.payload) : s;
  }, state);
}

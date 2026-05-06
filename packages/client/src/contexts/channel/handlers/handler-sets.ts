import type { ChannelState } from '@/types/chat';
import { messageHandlerOn } from './message.ts';
import { notificationHandlerOn } from './notification.ts';
import { planHandlerOn } from './plan.ts';
import { sessionHandlerOn } from './session.ts';
import { streamingHandlerOn } from './streaming.ts';
import { systemHandlerOn } from './system.ts';

type HandlerMap = Record<string, (s: ChannelState, p: unknown) => ChannelState>;

const allHandlers: HandlerMap = {
  ...messageHandlerOn,
  ...streamingHandlerOn,
  ...systemHandlerOn,
  ...planHandlerOn,
  ...notificationHandlerOn,
  ...sessionHandlerOn,
} as HandlerMap;

function buildHandlers(exclude: Set<string>): HandlerMap {
  return Object.fromEntries(Object.entries(allHandlers).filter(([k]) => !exclude.has(k)));
}

// Session lifecycle events excluded — transient connection state, must not replay.
const sessionKeys = new Set(Object.keys(sessionHandlerOn));

export const liveHandlers: HandlerMap = buildHandlers(sessionKeys);
export { liveHandlers as historyHandlers };

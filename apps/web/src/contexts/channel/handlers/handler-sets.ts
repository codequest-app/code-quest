import type { ChannelState } from '@/types/chat';
import { hookHandlerOn } from './hook.ts';
import { messageHandlerOn } from './message.ts';
import { notificationHandlerOn } from './notification.ts';
import { planHandlerOn } from './plan.ts';
import { sessionHandlerOn } from './session.ts';
import { streamingHandlerOn } from './streaming.ts';
import { systemHandlerOn } from './system.ts';
import { taskHandlerOn } from './task.ts';

type HandlerMap = Record<string, (s: ChannelState, p: unknown) => ChannelState>;

const allHandlers: HandlerMap = {
  ...messageHandlerOn,
  ...streamingHandlerOn,
  ...systemHandlerOn,
  ...hookHandlerOn,
  ...taskHandlerOn,
  ...planHandlerOn,
  ...notificationHandlerOn,
  ...sessionHandlerOn,
} as HandlerMap;

function buildHandlers(exclude: Set<string>): HandlerMap {
  return Object.fromEntries(Object.entries(allHandlers).filter(([k]) => !exclude.has(k)));
}

// Session lifecycle events excluded — transient connection state, must not replay.
const sessionKeys = new Set(Object.keys(sessionHandlerOn));

export const messageHandlers: HandlerMap = buildHandlers(sessionKeys);

const replayExcludeKeys = new Set([
  ...sessionKeys,
  'stream:chunk',
  'stream:block_start',
  'stream:block_stop',
  'stream:end',
  'stream:message_start',
  'stream:message_delta',
]);

export const replayHandlers: HandlerMap = buildHandlers(replayExcludeKeys);

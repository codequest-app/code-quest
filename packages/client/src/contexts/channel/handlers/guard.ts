import type { ServerToClientEvents } from '@code-quest/shared';
import type { TypedSocket } from '@/socket/client';
import type { ChannelState } from '@/types/chat';
import { msg } from '@/utils/message';

/** Extract payload type from a ServerToClientEvents event. */
export type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

/** Append a message to channel state. */
export function addMessage(state: ChannelState, fields: Parameters<typeof msg>[0]): ChannelState {
  return { ...state, messages: [...state.messages, msg(fields)] };
}

/**
 * Creates a channelId guard function for socket event filtering.
 * Events with matching channelId or empty channelId (broadcast) pass through.
 */
function createGuard(channelId: string) {
  return function guard(payload: { channelId: string }): boolean {
    return payload.channelId === channelId || payload.channelId === '';
  };
}

/**
 * Auto-wire a handler map to socket events.
 * Each handler: (state, payload) → newState.
 * Guard + on/off lifecycle handled automatically.
 * Returns cleanup function for useEffect.
 */
export function wireHandlers<S, D = never>(
  socket: TypedSocket,
  channelId: string,
  handlers: Record<string, (state: S, payload: never) => S>,
  setState: (fn: (prev: S) => S) => void,
  options?: {
    /** Called before state update for specific events (e.g., resetStreamingRefs). */
    beforeUpdate?: (event: string, payload: { channelId: string }) => void;
    /** Events that skip guard check (e.g., 'disconnect'). */
    skipGuard?: Set<string>;
    /** Side-effect handlers: (deps, payload) → void. Runs after state update. */
    effects?: Record<string, (deps: D, payload: never) => void>;
    /** Dependencies passed to effect handlers. */
    effectDeps?: D;
  },
): () => void {
  const guard = createGuard(channelId);
  const { skipGuard, beforeUpdate, effects, effectDeps } = options ?? {};

  const allEvents = new Set([...Object.keys(handlers), ...Object.keys(effects ?? {})]);

  const wired = [...allEvents].map((event) => {
    const stateHandler = handlers[event];
    const effectHandler = effects?.[event];

    function onEvent(payload: { channelId: string }) {
      if (!skipGuard?.has(event) && !guard(payload)) return;
      beforeUpdate?.(event, payload);
      if (stateHandler) setState((prev) => stateHandler(prev, payload as never));
      if (effectHandler && effectDeps !== undefined) effectHandler(effectDeps, payload as never);
    }
    socket.on(event as never, onEvent as never);
    return { event, fn: onEvent };
  });

  return function cleanup() {
    for (const { event, fn } of wired) {
      socket.off(event as never, fn as never);
    }
  };
}

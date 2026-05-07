import type { ServerToClientEvents } from '@code-quest/shared';

/** Extract payload type from a ServerToClientEvents event. */
export type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

/**
 * Check whether a broadcast payload targets the expected channel.
 * Matches exact channelId or the empty string (broadcast-to-all).
 */
export function matchesChannel(expected: string, payload: { channelId: string }): boolean {
  return payload.channelId === expected || payload.channelId === '';
}

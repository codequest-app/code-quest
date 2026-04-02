/**
 * Creates a channelId guard function for socket event filtering.
 * Events with matching channelId or empty channelId (broadcast) pass through.
 */
export function createGuard(channelId: string) {
  return function guard(payload: { channelId: string }): boolean {
    return payload.channelId === channelId || payload.channelId === '';
  };
}

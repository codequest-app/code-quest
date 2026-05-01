import { sessionBroadcastStateSchema } from '@code-quest/shared';

export const TERMINAL_STATES: Set<string> = new Set(
  sessionBroadcastStateSchema.extract(['exited', 'disconnected']).options,
);

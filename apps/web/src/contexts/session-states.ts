import { sessionBroadcastStateSchema } from '@code-quest/schemas';

export const TERMINAL_STATES: Set<string> = new Set(
  sessionBroadcastStateSchema.extract(['exited', 'disconnected']).options,
);

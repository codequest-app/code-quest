import type { LaunchOptions, ProcessRunner } from '@code-quest/summoner';

export interface RunnerFactory {
  create(opts?: LaunchOptions): ProcessRunner;
  readonly command: string;
  readonly args: string[];
}

export const TYPES = {
  RunnerFactory: Symbol.for('RunnerFactory'),
  SessionStore: Symbol.for('SessionStore'),
  RawEventStore: Symbol.for('RawEventStore'),
  ChatHandler: Symbol.for('ChatHandler'),
  Database: Symbol.for('Database'),
  UsageTracker: Symbol.for('UsageTracker'),
  SettingsStore: Symbol.for('SettingsStore'),
  ChannelManager: Symbol.for('ChannelManager'),
} as const;

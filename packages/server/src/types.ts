export const TYPES = {
  ProcessFactory: Symbol.for('ProcessFactory'),
  SessionManager: Symbol.for('SessionManager'),
  SessionStore: Symbol.for('SessionStore'),
  RawEventStore: Symbol.for('RawEventStore'),
  ChatHandler: Symbol.for('ChatHandler'),
  Database: Symbol.for('Database'),
} as const;

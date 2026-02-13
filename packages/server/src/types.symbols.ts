/**
 * Inversify binding identifiers (symbols for interface-based injection)
 */
export const TYPES = {
  // Singleton services
  TerminalManager: Symbol.for('TerminalManager'),
  ChatManager: Symbol.for('ChatManager'),
  SocketHandler: Symbol.for('SocketHandler'),

  // Factories (return functions)
  TerminalSessionFactory: Symbol.for('TerminalSessionFactory'),
  ChatSessionFactory: Symbol.for('ChatSessionFactory'),
  OrchestratorSessionFactory: Symbol.for('OrchestratorSessionFactory'),
  ParserFactory: Symbol.for('ParserFactory'),

  // Config
  ChatCommandsConfig: Symbol.for('ChatCommandsConfig'),
} as const;

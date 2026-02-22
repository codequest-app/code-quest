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
  ProcessFactory: Symbol.for('ProcessFactory'),

  // Config
  ChatCommandsConfig: Symbol.for('ChatCommandsConfig'),
  ServerConfig: Symbol.for('ServerConfig'),

  // Logging
  ChatLogger: Symbol.for('ChatLogger'),
  ChatLoggerItem: Symbol.for('ChatLoggerItem'),

  // Git
  GitService: Symbol.for('GitService'),

  // Database
  Database: Symbol.for('Database'),
  ChatLogRepository: Symbol.for('ChatLogRepository'),

  // Server
  Server: Symbol.for('Server'),
} as const;

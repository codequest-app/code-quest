/**
 * Terminal module
 * Provides terminal session management using node-pty
 */

export { TerminalManagerImpl } from './manager.ts';
export { TerminalSessionImpl } from './session.ts';
export type {
  TerminalDimensions,
  TerminalManager,
  TerminalSession,
  TerminalSessionOptions,
} from './types.ts';

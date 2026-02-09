/**
 * Terminal module
 * Provides terminal session management using node-pty
 */

export { TerminalSessionImpl } from './session';
export { TerminalManagerImpl } from './manager';
export type {
  TerminalSession,
  TerminalManager,
  TerminalSessionOptions,
  TerminalDimensions,
} from './types';

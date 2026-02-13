/**
 * Terminal module
 * Provides terminal session management using node-pty
 */

export { TerminalManagerImpl } from './manager';
export { TerminalSessionImpl } from './session';
export type {
  TerminalDimensions,
  TerminalManager,
  TerminalSession,
  TerminalSessionOptions,
} from './types';

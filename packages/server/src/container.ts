import 'reflect-metadata';
import { Container, inject, injectable } from 'inversify';
import { ChatManagerImpl } from './chat/manager';
import type { ChatManager } from './chat/types';
import { TerminalManagerImpl } from './terminal/manager';
import type { TerminalManager } from './terminal/types';

/**
 * Inversify binding identifiers (symbols for interface-based injection)
 */
export const TYPES = {
  TerminalManager: Symbol.for('TerminalManager'),
  ChatManager: Symbol.for('ChatManager'),
} as const;

/**
 * Create and configure the DI container with default bindings.
 */
export function createContainer(): Container {
  const container = new Container();

  container.bind<TerminalManager>(TYPES.TerminalManager).to(TerminalManagerImpl).inSingletonScope();
  container.bind<ChatManager>(TYPES.ChatManager).to(ChatManagerImpl).inSingletonScope();

  return container;
}

export { Container, injectable, inject };

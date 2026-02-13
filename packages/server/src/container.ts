import 'reflect-metadata';
import { Container, inject, injectable } from 'inversify';
import { ChatManagerImpl } from './chat/manager.ts';
import type { ChatManager } from './chat/types.ts';
import { TerminalManagerImpl } from './terminal/manager.ts';
import type { TerminalManager } from './terminal/types.ts';

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

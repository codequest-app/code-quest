import type { AgentTransport } from '@code-quest/schemas';
import { logger } from '../logger.ts';
import type { AgentHandler } from './agent-handler.ts';

export class Agent {
  private readonly handlers: AgentHandler[];

  constructor(handlers: AgentHandler[]) {
    this.handlers = handlers;
  }

  attach(rpc: AgentTransport): void {
    for (const handler of this.handlers) {
      handler.attach(rpc);
    }
  }

  dispose(): void {
    for (const handler of this.handlers) {
      handler.dispose?.();
    }
    logger.info('Agent disposed');
  }
}

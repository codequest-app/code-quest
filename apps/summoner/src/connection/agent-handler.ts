import type { AgentTransport } from '@code-quest/schemas';

export interface AgentHandler {
  attach(rpc: AgentTransport): void;
}

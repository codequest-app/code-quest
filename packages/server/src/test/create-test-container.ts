import type { Container } from 'inversify';
import type { ChatCommandsConfig, ChatSessionFactory, ProcessFactory } from '../chat/types.ts';
import { createContainer, TYPES } from '../container.ts';
import type { OrchestratorSessionFactory } from '../orchestrator/types.ts';
import type { TerminalSessionFactory } from '../terminal/types.ts';
import type { ServerConfig } from '../types.ts';

export interface TestContainerOverrides {
  serverConfig?: ServerConfig;
  chatCommandsConfig?: ChatCommandsConfig;
  processFactory?: ProcessFactory;
  terminalSessionFactory?: TerminalSessionFactory;
  chatSessionFactory?: ChatSessionFactory;
  orchestratorSessionFactory?: OrchestratorSessionFactory;
}

export function createTestContainer(overrides?: TestContainerOverrides): Container {
  const container = createContainer();

  if (overrides?.serverConfig) {
    container.rebindSync<ServerConfig>(TYPES.ServerConfig).toConstantValue(overrides.serverConfig);
  }
  if (overrides?.processFactory) {
    container
      .rebindSync<ProcessFactory>(TYPES.ProcessFactory)
      .toConstantValue(overrides.processFactory);
  }
  if (overrides?.chatCommandsConfig) {
    container
      .rebindSync<ChatCommandsConfig>(TYPES.ChatCommandsConfig)
      .toConstantValue(overrides.chatCommandsConfig);
  }
  if (overrides?.terminalSessionFactory) {
    container
      .rebindSync<TerminalSessionFactory>(TYPES.TerminalSessionFactory)
      .toConstantValue(overrides.terminalSessionFactory);
  }
  if (overrides?.chatSessionFactory) {
    container
      .rebindSync<ChatSessionFactory>(TYPES.ChatSessionFactory)
      .toConstantValue(overrides.chatSessionFactory);
  }
  if (overrides?.orchestratorSessionFactory) {
    container
      .rebindSync<OrchestratorSessionFactory>(TYPES.OrchestratorSessionFactory)
      .toConstantValue(overrides.orchestratorSessionFactory);
  }

  return container;
}

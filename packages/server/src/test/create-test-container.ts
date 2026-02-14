import type { Container } from 'inversify';
import type { ChatCommandsConfig, ProcessFactory } from '../chat/types.ts';
import { createContainer, TYPES } from '../container.ts';
import type { GitService } from '../git/types.ts';
import type { ServerConfig } from '../types.ts';

export interface TestContainerOverrides {
  serverConfig?: ServerConfig;
  chatCommandsConfig?: ChatCommandsConfig;
  processFactory?: ProcessFactory;
  gitService?: GitService;
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
  if (overrides?.gitService) {
    container.rebindSync<GitService>(TYPES.GitService).toConstantValue(overrides.gitService);
  }

  return container;
}

import 'reflect-metadata';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ParserFactory, ProcessFactory } from '@code-quest/cli-adapter';
import { ChatSessionImpl, createParser } from '@code-quest/cli-adapter';
import { Container } from 'inversify';
import { CompositeChatLogger } from './chat/composite-logger.ts';
import { FileChatLogger } from './chat/file-logger.ts';
import type { ChatLogger } from './chat/logger.ts';
import { ChatManagerImpl } from './chat/manager.ts';
import type {
  ChatCommandsConfig,
  ChatManager,
  ChatSessionFactory,
  ChatSessionOptions,
} from './chat/types.ts';
import { DrizzleChatLogger } from './database/drizzle-logger.ts';
import { createMysqlRepository } from './database/mysql-repository.ts';
import type { ChatLogRepository } from './database/repository.ts';
import { createSqliteRepository } from './database/sqlite-repository.ts';
import { GitServiceImpl } from './git/service.ts';
import type { GitService } from './git/types.ts';
import { OrchestratorSessionImpl } from './orchestrator/session.ts';
import type { OrchestratorSessionFactory } from './orchestrator/types.ts';
import { ServerImpl } from './server.ts';
import { SocketHandlerImpl } from './socket/handler.ts';
import type { SocketHandler } from './socket/types.ts';
import { TerminalManagerImpl } from './terminal/manager.ts';
import { TerminalSessionImpl } from './terminal/session.ts';
import type { TerminalManager, TerminalSessionFactory } from './terminal/types.ts';
import { TYPES } from './types.symbols.ts';
import type { Server, ServerConfig } from './types.ts';

export { TYPES } from './types.symbols.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getChatCommandsConfig(): ChatCommandsConfig {
  const MOCK_CLI_PATH = path.resolve(__dirname, './test/mock-cli.ts');
  const FAKE_CLAUDE_SCRIPT = path.resolve(__dirname, '../../../e2e/fixtures/fake-claude.sh');
  const FAKE_GEMINI_SCRIPT = path.resolve(__dirname, '../../../e2e/fixtures/fake-gemini.sh');

  if (process.env.MOCK_CLI === 'true') {
    return {
      claude: { command: 'npx', baseArgs: ['tsx', MOCK_CLI_PATH, '--provider', 'claude'] },
      gemini: { command: 'npx', baseArgs: ['tsx', MOCK_CLI_PATH, '--provider', 'gemini'] },
    };
  }

  if (process.env.MOCK_CLI === 'shell') {
    return {
      claude: { command: 'bash', baseArgs: [FAKE_CLAUDE_SCRIPT] },
      gemini: { command: 'bash', baseArgs: [FAKE_GEMINI_SCRIPT] },
    };
  }

  return {
    claude: {
      command: 'claude',
      baseArgs: [
        '--output-format',
        'stream-json',
        '--input-format',
        'stream-json',
        '--verbose',
        '--permission-prompt-tool',
        'stdio',
      ],
      mode: 'interactive' as const,
    },
    gemini: {
      command: 'gemini',
      baseArgs: ['-o', 'stream-json'],
    },
  };
}

/**
 * Create and configure the DI container with default bindings.
 */
export function createContainer(): Container {
  const container = new Container();

  // ── Config ──
  container.bind<ServerConfig>(TYPES.ServerConfig).toConstantValue({ port: 0 });

  container
    .bind<ChatCommandsConfig>(TYPES.ChatCommandsConfig)
    .toConstantValue(getChatCommandsConfig());

  // ── Factories ──
  container
    .bind<TerminalSessionFactory>(TYPES.TerminalSessionFactory)
    .toConstantValue((options) => new TerminalSessionImpl(options));

  container
    .bind<ParserFactory>(TYPES.ParserFactory)
    .toConstantValue((provider) => createParser(provider));

  container.bind<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(spawn);

  container.bind<ChatSessionFactory>(TYPES.ChatSessionFactory).toDynamicValue((context) => {
    return (options: ChatSessionOptions) => {
      const parserFactory = context.get<ParserFactory>(TYPES.ParserFactory);
      const processFactory = context.get<ProcessFactory>(TYPES.ProcessFactory);
      return new ChatSessionImpl({ ...options, processFactory, parserFactory });
    };
  });

  container
    .bind<OrchestratorSessionFactory>(TYPES.OrchestratorSessionFactory)
    .toDynamicValue((context) => {
      return (opts) => {
        const chatManager = context.get<ChatManager>(TYPES.ChatManager);
        const gitService = context.get<GitService>(TYPES.GitService);
        const chatLogger = context.get<ChatLogger>(TYPES.ChatLogger);
        return new OrchestratorSessionImpl({
          chatManager,
          gitService,
          chatLogger,
          provider: opts.provider,
        });
      };
    });

  // ── Singletons ──
  container.bind<TerminalManager>(TYPES.TerminalManager).to(TerminalManagerImpl).inSingletonScope();

  container.bind<ChatManager>(TYPES.ChatManager).to(ChatManagerImpl).inSingletonScope();

  container
    .bind<ChatLogRepository>(TYPES.ChatLogRepository)
    .toDynamicValue(() => {
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        return createMysqlRepository(databaseUrl);
      }
      return createSqliteRepository('logs/chat.db');
    })
    .inSingletonScope();

  container.bind<ChatLogger>(TYPES.ChatLoggerItem).to(FileChatLogger);

  container.bind<ChatLogger>(TYPES.ChatLoggerItem).toDynamicValue((context) => {
    const repository = context.get<ChatLogRepository>(TYPES.ChatLogRepository);
    return new DrizzleChatLogger(repository);
  });

  container
    .bind<ChatLogger>(TYPES.ChatLogger)
    .toDynamicValue((context) => {
      const loggers = context.getAll<ChatLogger>(TYPES.ChatLoggerItem);
      return new CompositeChatLogger(loggers);
    })
    .inSingletonScope();

  container.bind<GitService>(TYPES.GitService).to(GitServiceImpl).inSingletonScope();

  container.bind<SocketHandler>(TYPES.SocketHandler).to(SocketHandlerImpl).inSingletonScope();

  container.bind<Server>(TYPES.Server).to(ServerImpl).inSingletonScope();

  return container;
}

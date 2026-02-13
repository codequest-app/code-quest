import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Container, inject, injectable } from 'inversify';
import { ChatManagerImpl } from './chat/manager.ts';
import { createParser } from './chat/parsers/index.ts';
import { ChatSessionImpl } from './chat/session.ts';
import type {
  ChatCommandsConfig,
  ChatManager,
  ChatSessionFactory,
  ChatSessionOptions,
  ParserFactory,
} from './chat/types.ts';
import { OrchestratorSessionImpl } from './orchestrator/session.ts';
import type { OrchestratorSessionFactory } from './orchestrator/types.ts';
import { SocketHandlerImpl } from './socket/handler.ts';
import type { SocketHandler } from './socket/types.ts';
import { TerminalManagerImpl } from './terminal/manager.ts';
import { TerminalSessionImpl } from './terminal/session.ts';
import type { TerminalManager, TerminalSessionFactory } from './terminal/types.ts';
import { TYPES } from './types.symbols.ts';

export { TYPES } from './types.symbols.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getChatCommandsConfig(): ChatCommandsConfig {
  const MOCK_CLI_PATH = path.resolve(__dirname, '../test/mock-cli.ts');
  const FAKE_CLAUDE_SCRIPT = path.resolve(__dirname, '../../../../e2e/fixtures/fake-claude.sh');
  const FAKE_GEMINI_SCRIPT = path.resolve(__dirname, '../../../../e2e/fixtures/fake-gemini.sh');

  if (process.env.MOCK_CLI === 'true') {
    return {
      claude: { command: 'npx', baseArgs: ['tsx', MOCK_CLI_PATH] },
      gemini: { command: 'npx', baseArgs: ['tsx', MOCK_CLI_PATH] },
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
      baseArgs: ['-p', '--output-format', 'stream-json', '--verbose'],
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

  container.bind<ChatSessionFactory>(TYPES.ChatSessionFactory).toDynamicValue((context) => {
    const parserFactory = context.get<ParserFactory>(TYPES.ParserFactory);
    return (options: ChatSessionOptions) => new ChatSessionImpl({ ...options, parserFactory });
  });

  container
    .bind<OrchestratorSessionFactory>(TYPES.OrchestratorSessionFactory)
    .toDynamicValue((context) => {
      const chatManager = context.get<ChatManager>(TYPES.ChatManager);
      return (opts) => new OrchestratorSessionImpl({ chatManager, provider: opts.provider });
    });

  // ── Singletons ──
  container.bind<TerminalManager>(TYPES.TerminalManager).to(TerminalManagerImpl).inSingletonScope();

  container.bind<ChatManager>(TYPES.ChatManager).to(ChatManagerImpl).inSingletonScope();

  container.bind<SocketHandler>(TYPES.SocketHandler).to(SocketHandlerImpl).inSingletonScope();

  return container;
}

export { Container, injectable, inject };

import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectable } from 'inversify';
import { ChatSessionImpl } from './session.ts';
import type { ChatManager, ChatProvider, ChatSession } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_CLI_PATH = path.resolve(__dirname, '../test/mock-cli.ts');

const FAKE_CLAUDE_SCRIPT = path.resolve(__dirname, '../../../../e2e/fixtures/fake-claude.sh');

const FAKE_GEMINI_SCRIPT = path.resolve(__dirname, '../../../../e2e/fixtures/fake-gemini.sh');

function getCommands(): Record<ChatProvider, { command: string; baseArgs: string[] }> {
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

@injectable()
export class ChatManagerImpl implements ChatManager {
  private sessions = new Map<string, ChatSession>();

  createSession(options: { provider: ChatProvider; cwd?: string }): ChatSession {
    const commands = getCommands();
    const defaults = commands[options.provider];
    const session = new ChatSessionImpl({
      provider: options.provider,
      command: defaults.command,
      baseArgs: [...defaults.baseArgs],
      cwd: options.cwd,
    });

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  removeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.kill();
      this.sessions.delete(id);
    }
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  cleanup(): void {
    for (const session of this.sessions.values()) {
      session.kill();
    }
    this.sessions.clear();
  }
}

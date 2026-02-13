import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChatStreamEvent } from '@code-quest/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { TYPES } from '../../container.ts';
import { createTestContainer } from '../../test/create-test-container.ts';
import type { ChatSession, ChatSessionFactory } from '../types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAKE_CLAUDE_PATH = path.resolve(__dirname, '../../../../../e2e/fixtures/fake-claude.sh');

const FAKE_GEMINI_PATH = path.resolve(__dirname, '../../../../../e2e/fixtures/fake-gemini.sh');

describe('ChatSessionImpl (integration)', () => {
  let chatSessionFactory: ChatSessionFactory;

  beforeEach(() => {
    const container = createTestContainer();
    chatSessionFactory = container.get<ChatSessionFactory>(TYPES.ChatSessionFactory);
  });

  it('should spawn fake-claude and parse real fixture output', async () => {
    const session: ChatSession = chatSessionFactory({
      provider: 'claude',
      command: 'bash',
      baseArgs: [FAKE_CLAUDE_PATH],
      // No processFactory — uses real spawn
    });

    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    await new Promise<void>((resolve) => {
      session.onExit(() => resolve());
      session.sendMessage('hello');
    });

    expect(events.some((e) => e.type === 'init')).toBe(true);
    expect(events.some((e) => e.type === 'text')).toBe(true);
    expect(events.some((e) => e.type === 'result')).toBe(true);

    const init = events.find((e) => e.type === 'init');
    expect(init).toBeDefined();
    expect(init?.data).toHaveProperty('sessionId');

    session.kill();
  });

  it('should spawn fake-gemini and parse real fixture output', async () => {
    const session: ChatSession = chatSessionFactory({
      provider: 'gemini',
      command: 'bash',
      baseArgs: [FAKE_GEMINI_PATH],
    });

    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    await new Promise<void>((resolve) => {
      session.onExit(() => resolve());
      session.sendMessage('hello');
    });

    expect(events.some((e) => e.type === 'init')).toBe(true);
    expect(events.some((e) => e.type === 'text')).toBe(true);
    expect(events.some((e) => e.type === 'result')).toBe(true);

    session.kill();
  });

  it('should use FIXTURE env to select different fixtures', async () => {
    const toolUseFixture = path.resolve(
      __dirname,
      '../../../../../e2e/fixtures/fixtures/claude-tool-use.jsonl',
    );

    const session: ChatSession = chatSessionFactory({
      provider: 'claude',
      command: 'bash',
      baseArgs: [FAKE_CLAUDE_PATH],
      env: { ...process.env, FIXTURE: toolUseFixture },
    });

    const events: ChatStreamEvent[] = [];
    session.onEvent((e) => events.push(e));

    await new Promise<void>((resolve) => {
      session.onExit(() => resolve());
      session.sendMessage('read package.json');
    });

    expect(events.some((e) => e.type === 'tool_use')).toBe(true);
    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    expect(toolUse?.data).toHaveProperty('name', 'Read');

    session.kill();
  });
});

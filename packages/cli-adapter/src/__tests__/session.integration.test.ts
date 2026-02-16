import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChatStreamEvent } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { createParser } from '../parsers/index.ts';
import { ChatSessionImpl } from '../session.ts';
import type { ChatSession } from '../types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAKE_CLAUDE_PATH = path.resolve(__dirname, '../../../../e2e/fixtures/fake-claude.sh');

const FAKE_GEMINI_PATH = path.resolve(__dirname, '../../../../e2e/fixtures/fake-gemini.sh');

describe('ChatSessionImpl (integration)', () => {
  function createSession(
    provider: 'claude' | 'gemini',
    command: string,
    baseArgs: string[],
    env?: Record<string, string | undefined>,
  ): ChatSession {
    return new ChatSessionImpl({
      provider,
      command,
      baseArgs,
      processFactory: spawn,
      parserFactory: createParser,
      env,
    });
  }

  it('should spawn fake-claude and parse real fixture output', async () => {
    const session = createSession('claude', 'bash', [FAKE_CLAUDE_PATH]);

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
    const session = createSession('gemini', 'bash', [FAKE_GEMINI_PATH]);

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
      '../../../../e2e/fixtures/fixtures/claude-tool-use.jsonl',
    );

    const session = createSession('claude', 'bash', [FAKE_CLAUDE_PATH], {
      ...process.env,
      FIXTURE: toolUseFixture,
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

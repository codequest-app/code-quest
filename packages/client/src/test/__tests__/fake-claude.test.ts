import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../fake-claude';

describe('FakeClaude', () => {
  it('emit sends segment through pipeline, socket receives event', async () => {
    const claude = createFakeClaude();
    const channelId = await claude.initialize(s.init('cli-sess'), {
      launch: { channelId: 'test-ch-1' },
    });
    expect(channelId).toBeTruthy();

    await claude.send('chat:send', { channelId, message: 'hello' });

    const events: string[] = [];
    claude.socket.on('message:assistant', () => {
      events.push('message:assistant');
    });

    await claude.emit(s.assistant('Hello from Claude'));

    expect(events).toContain('message:assistant');
  });

  it('received() returns what client sent to Claude', async () => {
    const claude = createFakeClaude();
    const channelId = await claude.initialize(s.init('cli-sess'), {
      launch: { channelId: 'test-ch-2' },
    });

    await claude.send('chat:send', { channelId, message: 'fix the bug' });

    const userMessages = claude.received('user');
    expect(userMessages.length).toBeGreaterThan(0);
    expect(userMessages[0]).toEqual(expect.objectContaining({ type: 'user' }));
  });

  it('exposes socket for wiring into production Providers', () => {
    const claude = createFakeClaude();
    expect(claude.socket).toBeTruthy();
    expect(claude.socket.connect).toBeDefined();
  });

  it('has no init() method', () => {
    const claude = createFakeClaude();
    expect((claude as unknown as Record<string, unknown>).init).toBeUndefined();
  });
});

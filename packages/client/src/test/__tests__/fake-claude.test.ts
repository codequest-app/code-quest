import { segments as s } from '@code-quest/summoner/test';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../fake-summoner';

describe('FakeSummoner', () => {
  it('emit sends segment through pipeline, events() records it', async () => {
    const summoner = createFakeSummoner();
    const channelId = await summoner.claude().initialize(s.init('cli-sess'), {
      launch: { channelId: 'test-ch-1' },
    });
    expect(channelId).toBeTruthy();

    await summoner.send('chat:send', { channelId, message: 'hello' });
    await summoner.claude().emit(s.assistant('Hello from Claude'));

    const events = summoner.events('message:assistant');
    expect(events.length).toBeGreaterThan(0);
  });

  it('received() returns what client sent to Claude', async () => {
    const summoner = createFakeSummoner();
    const channelId = await summoner.claude().initialize(s.init('cli-sess'), {
      launch: { channelId: 'test-ch-2' },
    });

    await summoner.send('chat:send', { channelId, message: 'fix the bug' });

    const userMessages = summoner.claude().received('user');
    expect(userMessages.length).toBeGreaterThan(0);
    expect(userMessages[0]).toEqual(expect.objectContaining({ type: 'user' }));
  });

  it('summoner exposes socket for SocketProvider', () => {
    const summoner = createFakeSummoner();
    expect(summoner.socket).toBeTruthy();
    expect(summoner.socket.connect).toBeDefined();
  });
});

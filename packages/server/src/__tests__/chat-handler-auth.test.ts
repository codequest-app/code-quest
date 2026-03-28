/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeClaude } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

function collectEvents(socket: any, eventName: string) {
  const events: any[] = [];
  socket.on(eventName, (p: any) => events.push(p));
  return events;
}

describe('ChatHandler > auth', () => {
  it('emits auth:url when CLI outputs auth_url event', async () => {
    const { claude } = await setup();
    const authUrls = collectEvents(claude.socket, 'notification:auth_url');

    await claude.emit(s.authUrl('https://auth.example.com', 'oauth'));

    expect(authUrls).toHaveLength(1);
    expect(authUrls[0]).not.toHaveProperty('sessionId');
    expect(authUrls[0].url).toBe('https://auth.example.com');
    expect(authUrls[0].method).toBe('oauth');
  });
});

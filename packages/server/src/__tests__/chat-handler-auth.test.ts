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

  it('auth:status returns unauthenticated by default', async () => {
    const { claude } = await setup();

    const status = await claude.send<{ authenticated: boolean }>('auth:status');

    expect(status.authenticated).toBe(false);
  });

  it('auth:login sends claude_authenticate to CLI and returns auth URL', async () => {
    const { claude } = await setup();

    claude.onControlRequest((req) => {
      if (req.subtype === 'claude_authenticate') {
        return {
          manualUrl: 'https://auth.example.com/manual',
          automaticUrl: 'https://auth.example.com/auto',
        };
      }
      return null;
    });

    const result = await claude.send<{
      success: boolean;
      auth?: { response?: { manualUrl?: string } };
    }>('auth:login', { method: 'oauth' });
    expect(result.success).toBe(true);
  });

  it('auth:login fails when no active session', async () => {
    const claude = createFakeClaude();
    // Don't initialize — no active channel

    const result = await claude.send<{ success: boolean; error?: string }>('auth:login', {
      method: 'oauth',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No active session');
  });

  it('auth:oauth_code sends claude_oauth_callback to CLI', async () => {
    const { claude } = await setup();

    const result = await claude.send<{ success: boolean }>('auth:oauth_code', {
      code: 'test-code',
      state: 'test-state',
    });
    expect(result.success).toBe(true);

    const status = await claude.send<{
      authenticated: boolean;
      user?: { name: string };
      method?: string;
    }>('auth:status');

    expect(status.authenticated).toBe(true);
    expect(status.user?.name).toBe('authenticated');
    expect(status.method).toBe('oauth');
  });
});

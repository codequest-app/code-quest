import type { Ack, RpcResult } from '@code-quest/schemas';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

type AuthLoginResponse = RpcResult<{ auth?: unknown }>;
type AuthOauthCodeResponse = Ack;

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeSummoner().claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > auth', () => {
  it('emits auth:url when CLI outputs auth_url event', async () => {
    const { claude } = await setup();

    await claude.emitSegment(s.authUrl('https://auth.example.com', 'oauth'));

    const authUrls = claude.receivedEvents('notification:auth_url');
    expect(authUrls).toHaveLength(1);
    expect(authUrls[0]).not.toHaveProperty('sessionId');
    expect(authUrls[0]!.url).toBe('https://auth.example.com');
    expect(authUrls[0]!.method).toBe('oauth');
  });

  it('auth:status returns unauthenticated by default', async () => {
    const { claude } = await setup();

    const status = await claude.send<{ authenticated: boolean }>('auth:status');

    expect(status.authenticated).toBe(false);
  });

  it('auth:login sends claude_authenticate to CLI and returns auth URL', async () => {
    const { claude } = await setup();

    claude.setControlRequestHandler((req) => {
      if (req.subtype === 'claude_authenticate') {
        return {
          manualUrl: 'https://auth.example.com/manual',
          automaticUrl: 'https://auth.example.com/auto',
        };
      }
      return null;
    });

    const result = await claude.send<AuthLoginResponse>('auth:login', { method: 'oauth' });
    expect(result.ok).toBe(true);
  });

  it('auth:login fails when no active session', async () => {
    const claude = createFakeSummoner().claude();
    // Don't initialize — no active channel

    const result = await claude.send<AuthLoginResponse>('auth:login', {
      method: 'oauth',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('No active session');
  });

  it('auth:oauth_code sends claude_oauth_callback to CLI', async () => {
    const { claude } = await setup();

    const result = await claude.send<AuthOauthCodeResponse>('auth:oauth_code', {
      code: 'test-code',
      state: 'test-state',
    });
    expect(result.ok).toBe(true);

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

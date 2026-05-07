import type { IncomingMessage } from 'node:http';
import { type Authenticator, NullAuthenticator } from '@code-quest/shared/node';
import { describe, expect, it } from 'vitest';

function fakeReq(headers: Record<string, string> = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

describe('Authenticator interface', () => {
  it('NullAuthenticator returns AuthContext with default userId="anon"', async () => {
    const auth: Authenticator = new NullAuthenticator();

    const ctx = await auth.authenticate(fakeReq());

    expect(ctx).toEqual({ userId: 'anon' });
  });

  it('NullAuthenticator accepts a custom userId via constructor', async () => {
    const auth: Authenticator = new NullAuthenticator('u-42');

    const ctx = await auth.authenticate(fakeReq());

    expect(ctx).toEqual({ userId: 'u-42' });
  });

  it('a denying Authenticator returns null to signal rejection', async () => {
    const deny: Authenticator = { authenticate: async () => null };

    const ctx = await deny.authenticate(fakeReq({ cookie: 'invalid' }));

    expect(ctx).toBeNull();
  });

  it('Authenticator implementations can read request headers to decide', async () => {
    const headerCheck: Authenticator = {
      authenticate: async (req) => {
        const token = req.headers.authorization;
        return token === 'Bearer ok' ? { userId: 'u-1' } : null;
      },
    };

    expect(await headerCheck.authenticate(fakeReq({ authorization: 'Bearer ok' }))).toEqual({
      userId: 'u-1',
    });
    expect(await headerCheck.authenticate(fakeReq({ authorization: 'Bearer bad' }))).toBeNull();
    expect(await headerCheck.authenticate(fakeReq())).toBeNull();
  });
});

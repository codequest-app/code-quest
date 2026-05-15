import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { AuthContext, Authenticator } from '@code-quest/transport';

export class TokenAuthenticator implements Authenticator {
  private readonly expected: Buffer;

  constructor(token: string) {
    this.expected = Buffer.from(`Bearer ${token}`);
  }

  async authenticate(req: IncomingMessage): Promise<AuthContext | null> {
    const header = req.headers.authorization;
    if (!header) return null;
    const actual = Buffer.from(header);
    if (actual.length !== this.expected.length) return null;
    if (!timingSafeEqual(actual, this.expected)) return null;
    return { userId: 'anon' };
  }
}

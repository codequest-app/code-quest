import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/segments-node.ts';
import { expectName, toClientMessage } from '../helpers.ts';

describe('transform — auth', () => {
  describe('auth_status', () => {
    it('converts authenticated with output and account', () => {
      const result = toClientMessage(
        s.authStatus(false, {
          output: ['Logged in as user@example.com'],
          account: { email: 'user@example.com', plan: 'pro' },
        }),
      );
      expect(result).toMatchObject({
        name: 'notification:auth_status',
        payload: {
          status: 'authenticated',
          output: 'Logged in as user@example.com',
          account: { email: 'user@example.com', plan: 'pro' },
        },
      });
    });

    it('converts isAuthenticating=true', () => {
      const result = toClientMessage(s.authStatus(true, { output: [] }));
      expect(result).toMatchObject({
        name: 'notification:auth_status',
        payload: { status: 'authenticating' },
      });
    });

    it('omits account when not present', () => {
      const result = toClientMessage(s.authStatus(false, { output: [] }));
      const msg = expectName(result, 'notification:auth_status');
      expect(msg.payload.status).toBe('authenticated');
      expect(msg.payload.account).toBeUndefined();
    });
  });

  describe('auth_url', () => {
    it('converts auth_url with url and method', () => {
      const result = toClientMessage(s.authUrl('https://auth.test', 'oauth'));
      expect(result).toMatchObject({
        name: 'notification:auth_url',
        payload: { url: 'https://auth.test', method: 'oauth' },
      });
    });
  });
});

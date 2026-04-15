import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useSession } from '@/contexts/SessionContext';
import { renderWithChannel } from '@/test/render-with-channel';

function AuthProbe() {
  const { auth, login, submitOAuthCode } = useSession();
  return (
    <div>
      <span data-testid="auth-status">{auth.status}</span>
      <span data-testid="auth-error">{auth.errorMsg ?? ''}</span>
      <button type="button" onClick={() => login()}>
        login
      </button>
      <button type="button" onClick={() => submitOAuthCode('code-123')}>
        submit-oauth
      </button>
    </div>
  );
}

describe('SessionContext — auth callbacks (FakeSummoner)', () => {
  describe('auth:login', () => {
    it('sets status to error when server returns { ok: false }', async () => {
      const user = userEvent.setup();
      const { summoner } = await renderWithChannel(<AuthProbe />);

      // Intercept auth:login to return failure (no alive channel in fake server = error path)
      const origEmit = summoner.socket.emit.bind(summoner.socket);
      // @ts-expect-error — intercept FakeSocket.emit
      summoner.socket.emit = (event: string, ...args: unknown[]) => {
        if (event === 'auth:login') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ ok: false, error: 'No active session' });
          return summoner.socket;
        }
        return origEmit(event, ...args);
      };

      await act(async () => {
        await user.click(screen.getByText('login'));
        await new Promise<void>((r) => setTimeout(r, 50));
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('error');
      expect(screen.getByTestId('auth-error')).toHaveTextContent('No active session');
    });
  });

  describe('auth:oauth_code', () => {
    it('sets status to success when server returns { ok: true }', async () => {
      const user = userEvent.setup();
      const { summoner } = await renderWithChannel(<AuthProbe />);

      const origEmit = summoner.socket.emit.bind(summoner.socket);
      // @ts-expect-error — intercept FakeSocket.emit
      summoner.socket.emit = (event: string, ...args: unknown[]) => {
        if (event === 'auth:oauth_code') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ ok: true });
          return summoner.socket;
        }
        return origEmit(event, ...args);
      };

      await act(async () => {
        await user.click(screen.getByText('submit-oauth'));
        await new Promise<void>((r) => setTimeout(r, 50));
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('success');
    });

    it('sets status to error when server returns { ok: false }', async () => {
      const user = userEvent.setup();
      const { summoner } = await renderWithChannel(<AuthProbe />);

      const origEmit = summoner.socket.emit.bind(summoner.socket);
      // @ts-expect-error — intercept FakeSocket.emit
      summoner.socket.emit = (event: string, ...args: unknown[]) => {
        if (event === 'auth:oauth_code') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ ok: false, error: 'OAuth failed' });
          return summoner.socket;
        }
        return origEmit(event, ...args);
      };

      await act(async () => {
        await user.click(screen.getByText('submit-oauth'));
        await new Promise<void>((r) => setTimeout(r, 50));
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('error');
      expect(screen.getByTestId('auth-error')).toHaveTextContent('OAuth failed');
    });
  });
});

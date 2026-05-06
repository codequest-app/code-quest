import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useSession } from '@/contexts/SessionContext';
import { renderWithChannel } from '@/test/render-with-channel';

function AuthProbe() {
  const { auth, login, submitOAuthCode } = useSession();
  return (
    <div>
      <span role="status" aria-label="auth-status">
        {auth.status}
      </span>
      <span role="status" aria-label="auth-error">
        {auth.errorMsg ?? ''}
      </span>
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
    it('sets status to error when fake server has no active session', async () => {
      const user = userEvent.setup();
      // `skipInit: true` → renderWithChannel does not initialize a channel,
      // so the real fake-server auth handler returns { ok: false, error: 'No active session' }.
      await renderWithChannel(<AuthProbe />, { skipInit: true });

      await user.click(screen.getByText('login'));

      await waitFor(() => {
        expect(screen.getByRole('status', { name: 'auth-status' })).toHaveTextContent('error');
      });
      expect(screen.getByRole('status', { name: 'auth-error' })).toHaveTextContent(
        /no active session/i,
      );
    });
  });

  describe('auth:oauth_code', () => {
    it('sets status to success via natural fake-server flow', async () => {
      const user = userEvent.setup();
      // Default fake-server handles auth:oauth_code -> CLI control requests -> ok({})
      await renderWithChannel(<AuthProbe />);

      await user.click(screen.getByText('submit-oauth'));

      await waitFor(() => {
        expect(screen.getByRole('status', { name: 'auth-status' })).toHaveTextContent('success');
      });
    });

    it('sets status to error when server returns { ok: false }', async () => {
      // NOTE: `auth:oauth_code` failure can't be driven via the fake server —
      // `FakeClaude.setControlRequestHandler` only supports success responses. Until
      // the summoner harness exposes an error-response API, override the
      // socket.emit ack directly to exercise the client's SessionContext
      // error-handling path.
      const user = userEvent.setup();
      const { summoner } = await renderWithChannel(<AuthProbe />);

      const origEmit = summoner.socket.emit.bind(summoner.socket);
      // @ts-expect-error — intercept FakeSocket.emit (harness limitation)
      summoner.socket.emit = (event: string, ...args: unknown[]) => {
        if (event === 'auth:oauth_code') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ ok: false, error: 'OAuth failed' });
          return summoner.socket;
        }
        return origEmit(event, ...args);
      };

      await user.click(screen.getByText('submit-oauth'));

      await waitFor(() => {
        expect(screen.getByRole('status', { name: 'auth-status' })).toHaveTextContent('error');
      });
      expect(screen.getByRole('status', { name: 'auth-error' })).toHaveTextContent('OAuth failed');
    });
  });
});

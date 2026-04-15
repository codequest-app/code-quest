import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';
import { describe, expect, it } from 'vitest';
import { useChannelConfig } from '@/contexts/channel/index';
import { createFakeSummoner } from '@/test/fake-summoner';
import { renderWithChannel } from '@/test/render-with-channel';

function SetModelButton({ model }: { model: string }) {
  const { setModel } = useChannelConfig();
  return (
    <button type="button" onClick={() => setModel(model)}>
      switch-model
    </button>
  );
}

describe('setModel — callback response format', () => {
  it('does NOT show toast when server returns { ok: true }', async () => {
    // Option A: real fake server — naturally returns { ok: true } for valid model
    const user = userEvent.setup();
    await renderWithChannel(
      <>
        <Toaster />
        <SetModelButton model="claude-sonnet-4-6" />
      </>,
    );

    await act(async () => {
      await user.click(screen.getByText('switch-model'));
      await new Promise<void>((r) => setTimeout(r, 50));
    });

    expect(screen.queryByText(/Failed to switch model/i)).toBeNull();
  });

  it('shows toast when server returns { ok: false }', async () => {
    // Option B: intercept socket.emit callback to inject { ok: false }
    const user = userEvent.setup();
    const summoner = createFakeSummoner();

    const origEmit = summoner.socket.emit.bind(summoner.socket);
    // @ts-expect-error — intercepting FakeSocket.emit to simulate server error
    summoner.socket.emit = (event: string, ...args: unknown[]) => {
      if (event === 'settings:set_model') {
        const cb = args[args.length - 1];
        if (typeof cb === 'function') cb({ ok: false, error: 'Failed to switch model' });
        return summoner.socket;
      }
      return origEmit(event, ...args);
    };

    await renderWithChannel(
      <>
        <Toaster />
        <SetModelButton model="claude-sonnet-4-6" />
      </>,
      { summoner },
    );

    await act(async () => {
      await user.click(screen.getByText('switch-model'));
      await new Promise<void>((r) => setTimeout(r, 50));
    });

    expect(await screen.findByText(/Failed to switch model/i)).toBeInTheDocument();
  });
});

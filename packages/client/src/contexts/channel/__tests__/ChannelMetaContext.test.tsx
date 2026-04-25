import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '@/test/render-with-channel';
import { ChannelMetaProvider, useChannelMeta } from '../ChannelMetaContext';

function Display() {
  const meta = useChannelMeta();
  return (
    <>
      <span data-testid="channel-id">{meta.channelId}</span>
      <span data-testid="cwd">{meta.cwd ?? 'none'}</span>
    </>
  );
}

describe('ChannelMetaContext', () => {
  it('exposes channelId AND cwd to descendants', () => {
    render(
      <ChannelMetaProvider channelId="ch-1" cwd="/repo">
        <Display />
      </ChannelMetaProvider>,
    );
    expect(screen.getByTestId('channel-id')).toHaveTextContent('ch-1');
    expect(screen.getByTestId('cwd')).toHaveTextContent('/repo');
  });

  it('cwd is optional (legacy channels without recorded cwd return undefined)', () => {
    render(
      <ChannelMetaProvider channelId="ch-2">
        <Display />
      </ChannelMetaProvider>,
    );
    expect(screen.getByTestId('channel-id')).toHaveTextContent('ch-2');
    expect(screen.getByTestId('cwd')).toHaveTextContent('none');
  });

  it('throws when useChannelMeta() is called outside a provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<Display />)).toThrow(/ChannelMeta/);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ChannelProvider wires both channelId and cwd through useChannelMeta()', async () => {
    const { channelId } = await renderWithChannel(<Display />, {
      channelId: 'ch-smoke',
      cwd: '/test/cwd',
      skipInit: true,
      launchOnMount: false,
    });
    expect(screen.getByTestId('channel-id')).toHaveTextContent(channelId);
    expect(screen.getByTestId('cwd')).toHaveTextContent('/test/cwd');
  });
});

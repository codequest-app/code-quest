import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelIdProvider, useChannelId } from '../ChannelIdContext';

function Display() {
  const channelId = useChannelId();
  return <span data-testid="channel-id">{channelId}</span>;
}

describe('ChannelIdContext', () => {
  it('exposes the provider value to descendants via useChannelId()', () => {
    render(
      <ChannelIdProvider channelId="ch-1">
        <Display />
      </ChannelIdProvider>,
    );
    expect(screen.getByTestId('channel-id')).toHaveTextContent('ch-1');
  });

  it('throws when useChannelId() is called outside a provider', () => {
    // Suppress the error React logs when a component throws during render.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<Display />)).toThrow(/ChannelIdContext/);
    } finally {
      consoleError.mockRestore();
    }
  });
});

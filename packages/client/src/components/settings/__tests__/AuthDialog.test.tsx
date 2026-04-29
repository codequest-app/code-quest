import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '../../../test/render-with-channel';
import { AuthDialog } from '../AuthDialog';

async function renderAuth(opts: { open?: boolean } = {}) {
  const { open = true } = opts;
  const onClose = vi.fn();

  const result = await renderWithChannel(<AuthDialog open={open} onClose={onClose} />);

  return { onClose, ...result };
}

describe('AuthDialog', () => {
  it('shows login button when open', async () => {
    await renderAuth();
    expect(screen.getByText('Login with Browser')).toBeInTheDocument();
  });

  it('does not render when closed', async () => {
    await renderAuth({ open: false });
    expect(screen.queryByText('Login with Browser')).not.toBeInTheDocument();
  });

  it('shows cancel button', async () => {
    await renderAuth();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});

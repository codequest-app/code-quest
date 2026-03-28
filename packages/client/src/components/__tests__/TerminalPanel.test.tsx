import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { TerminalPanel } from '../TerminalPanel';

// Mock xterm to avoid DOM errors
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    loadAddon: vi.fn(),
    open: vi.fn(),
    writeln: vi.fn(),
    dispose: vi.fn(),
  })),
}));
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
  })),
}));

describe('TerminalPanel', () => {
  it('shows Open Claude button always', async () => {
    await renderWithChannel(<TerminalPanel />);
    expect(screen.getByTitle('Open Claude in terminal')).toBeInTheDocument();
  });

  it('"Open Claude" button is clickable without error', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<TerminalPanel />);
    await user.click(screen.getByTitle('Open Claude in terminal'));
  });
});

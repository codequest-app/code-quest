import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../SearchBar.tsx';

describe('SearchBar', () => {
  it('calls setSearchQuery on input change', async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar searchQuery="" setSearchQuery={setSearchQuery} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'h');
    expect(setSearchQuery).toHaveBeenCalledWith('h');
  });

  it('uses default placeholder when placeholder prop not provided', () => {
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('uses custom placeholder when placeholder prop is provided', () => {
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} placeholder="Search events..." />);
    expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
  });

  it('shows clear button when searchQuery is non-empty', () => {
    render(<SearchBar searchQuery="test" setSearchQuery={vi.fn()} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('hides clear button when searchQuery is empty', () => {
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('clears search on clear button click', async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar searchQuery="test" setSearchQuery={setSearchQuery} />);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(setSearchQuery).toHaveBeenCalledWith('');
  });

  it('does not show Raw button when onToggleRaw not provided', () => {
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /raw/i })).not.toBeInTheDocument();
  });

  it('shows Raw button when onToggleRaw is provided', () => {
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} onToggleRaw={vi.fn()} />);
    expect(screen.getByRole('button', { name: /raw/i })).toBeInTheDocument();
  });

  it('calls onToggleRaw when Raw button is clicked', async () => {
    const onToggleRaw = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} onToggleRaw={onToggleRaw} />);
    await user.click(screen.getByRole('button', { name: /raw/i }));
    expect(onToggleRaw).toHaveBeenCalledOnce();
  });

  it('Raw button has active style when rawActive is true', () => {
    render(
      <SearchBar searchQuery="" setSearchQuery={vi.fn()} onToggleRaw={vi.fn()} rawActive={true} />,
    );
    expect(screen.getByRole('button', { name: /raw/i })).toHaveAttribute('data-active', 'true');
  });

  it('Raw button has no active style when rawActive is false', () => {
    render(
      <SearchBar searchQuery="" setSearchQuery={vi.fn()} onToggleRaw={vi.fn()} rawActive={false} />,
    );
    expect(screen.getByRole('button', { name: /raw/i })).toHaveAttribute('data-active', 'false');
  });
});

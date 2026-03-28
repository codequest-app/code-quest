import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('calls setSearchQuery on input change', async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar searchQuery="" setSearchQuery={setSearchQuery} />);
    await user.type(screen.getByPlaceholderText(/search/i), 'h');
    expect(setSearchQuery).toHaveBeenCalledWith('h');
  });

  it('clears search on clear button click', async () => {
    const setSearchQuery = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar searchQuery="test" setSearchQuery={setSearchQuery} />);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(setSearchQuery).toHaveBeenCalledWith('');
  });

  it('toggles type filter dropdown on button click', async () => {
    const user = userEvent.setup();
    render(
      <SearchBar searchQuery="" setSearchQuery={vi.fn()} typeFilter={[]} setTypeFilter={vi.fn()} />,
    );
    expect(screen.queryByTestId('type-filter-dropdown')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /toggle type filter/i }));
    expect(screen.getByTestId('type-filter-dropdown')).toBeInTheDocument();
  });

  it('calls setTypeFilter when checking a type', async () => {
    const setTypeFilter = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchBar
        searchQuery=""
        setSearchQuery={vi.fn()}
        typeFilter={[]}
        setTypeFilter={setTypeFilter}
      />,
    );
    await user.click(screen.getByRole('button', { name: /toggle type filter/i }));
    await user.click(screen.getByLabelText('raw_event'));
    expect(setTypeFilter).toHaveBeenCalledWith(['raw_event']);
  });

  it('calls setTypeFilter to remove when unchecking a type', async () => {
    const setTypeFilter = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchBar
        searchQuery=""
        setSearchQuery={vi.fn()}
        typeFilter={['raw_event']}
        setTypeFilter={setTypeFilter}
      />,
    );
    await user.click(screen.getByRole('button', { name: /toggle type filter/i }));
    await user.click(screen.getByLabelText('raw_event'));
    expect(setTypeFilter).toHaveBeenCalledWith([]);
  });

  it('does not show filter button when setTypeFilter not provided', () => {
    render(<SearchBar searchQuery="" setSearchQuery={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /toggle type filter/i })).not.toBeInTheDocument();
  });
});

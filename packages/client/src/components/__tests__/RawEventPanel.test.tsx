import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RawEventPanel } from '../RawEventPanel';

const mockEvents = [
  { type: 'assistant', content: 'hello' },
  { type: 'tool_use', tool: 'bash', input: 'ls' },
  { type: 'assistant', content: 'world' },
  { type: 'result', status: 'done' },
];

function mockFetchRawEvents(events: unknown[]) {
  return async () => ({ events });
}

async function renderAndFetch(events: unknown[] = mockEvents) {
  const user = userEvent.setup();
  render(<RawEventPanel onFetch={mockFetchRawEvents(events)} onClose={vi.fn()} />);
  await user.click(screen.getByTitle('Refresh'));
  return user;
}

describe('RawEventPanel', () => {
  it('shows event type in summary when available', async () => {
    await renderAndFetch();
    expect(await screen.findByText('Event #1 — assistant')).toBeInTheDocument();
    expect(screen.getByText('Event #2 — tool_use')).toBeInTheDocument();
  });

  it('falls back to Event #N when type is absent', async () => {
    await renderAndFetch([{ content: 'hello' }]);
    expect(await screen.findByText('Event #1')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RawEventPanel onFetch={mockFetchRawEvents([])} onClose={onClose} />);
    await user.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders filter controls after fetching events', async () => {
    await renderAndFetch();
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters events by type when dropdown changes', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.selectOptions(screen.getByRole('combobox'), 'tool_use');

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].textContent).toContain('tool_use');
  });

  it('filters events by search text', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.type(screen.getByPlaceholderText('Search...'), 'bash');

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].textContent).toContain('tool_use');
  });

  it('combined type + search filter works', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.selectOptions(screen.getByRole('combobox'), 'assistant');
    await user.type(screen.getByPlaceholderText('Search...'), 'world');

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].textContent).toContain('assistant');
  });

  it('shows all events when filters are cleared', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.selectOptions(screen.getByRole('combobox'), 'tool_use');
    expect(screen.getAllByText(/^Event #/)).toHaveLength(1);

    await user.selectOptions(screen.getByRole('combobox'), '');
    expect(screen.getAllByText(/^Event #/)).toHaveLength(4);
  });
});

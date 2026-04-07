import { act, render, screen, within } from '@testing-library/react';
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

function createSubscribe() {
  const listeners: Array<(evt: unknown) => void> = [];
  const onSubscribe = (cb: (evt: unknown) => void) => {
    listeners.push(cb);
    return () => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  };
  const push = async (...evts: unknown[]) => {
    await act(async () => {
      for (const evt of evts) {
        for (const cb of listeners) cb(evt);
      }
    });
  };
  return { onSubscribe, push };
}

function getSelect() {
  return screen.getByTestId('type-filter') as HTMLSelectElement;
}

describe('RawEventPanel (streaming)', () => {
  it('renders event pushed via onSubscribe without clicking refresh', async () => {
    const { onSubscribe, push } = createSubscribe();
    render(<RawEventPanel onSubscribe={onSubscribe} onClose={vi.fn()} />);
    await push({ type: 'assistant', content: 'streamed' });

    expect(await screen.findByText(/Event #1 — assistant/)).toBeInTheDocument();
  });
});

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
});

describe('RawEventPanel type filter (multi-select)', () => {
  it('renders multi-select with options showing type and count', async () => {
    await renderAndFetch();
    const select = getSelect();
    const options = within(select).getAllByRole('option');
    // assistant(2), result(1), tool_use(1) — sorted
    expect(options.map((o) => o.textContent)).toEqual([
      'assistant (2)',
      'result (1)',
      'tool_use (1)',
    ]);
  });

  it('all non-delta types are selected (visible) by default', async () => {
    await renderAndFetch();
    const select = getSelect();
    const selected = Array.from(select.selectedOptions).map((o) => o.value);
    expect(selected).toEqual(['assistant', 'result', 'tool_use']);
  });

  it('deselecting a type hides its events', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    // Deselect assistant by clicking it (with deselectOptions)
    await user.deselectOptions(getSelect(), 'assistant');

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(2); // tool_use + result
    expect(summaries[0].textContent).toContain('tool_use');
    expect(summaries[1].textContent).toContain('result');
  });

  it('reselecting a type shows its events again', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.deselectOptions(getSelect(), 'assistant');
    expect(screen.getAllByText(/^Event #/)).toHaveLength(2);

    await user.selectOptions(getSelect(), 'assistant');
    expect(screen.getAllByText(/^Event #/)).toHaveLength(4);
  });

  it('filters events by search text', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.type(screen.getByPlaceholderText('Search...'), 'bash');

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].textContent).toContain('tool_use');
  });

  it('combined type deselect + search works', async () => {
    const user = await renderAndFetch();
    await screen.findByText('Event #1 — assistant');

    await user.deselectOptions(getSelect(), ['tool_use', 'result']);
    await user.type(screen.getByPlaceholderText('Search...'), 'world');

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].textContent).toContain('assistant');
  });
});

describe('RawEventPanel delta default hidden', () => {
  it('delta types are deselected by default', async () => {
    await renderAndFetch([
      { type: 'assistant', content: 'hello' },
      { type: 'content_block_delta', delta: { text: 'x' } },
      { type: 'content_block_delta', delta: { text: 'y' } },
      { type: 'result', status: 'done' },
    ]);

    const select = getSelect();
    const selected = Array.from(select.selectedOptions).map((o) => o.value);
    expect(selected).toEqual(['assistant', 'result']); // delta not selected

    const summaries = await screen.findAllByText(/^Event #/);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].textContent).toContain('assistant');
    expect(summaries[1].textContent).toContain('result');
  });

  it('user can select delta type to show its events', async () => {
    const user = await renderAndFetch([
      { type: 'assistant', content: 'hello' },
      { type: 'content_block_delta', delta: { text: 'x' } },
    ]);

    await screen.findByText(/Event #1/);
    await user.selectOptions(getSelect(), 'content_block_delta');

    expect(screen.getAllByText(/^Event #/)).toHaveLength(2);
  });

  it('streaming delta events are also hidden by default', async () => {
    const { onSubscribe, push } = createSubscribe();
    render(<RawEventPanel onSubscribe={onSubscribe} onClose={vi.fn()} />);

    await push(
      { type: 'assistant', content: 'hi' },
      { type: 'content_block_delta', delta: { text: 'a' } },
      { type: 'content_block_delta', delta: { text: 'b' } },
    );

    const summaries = screen.getAllByText(/^Event #/);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].textContent).toContain('assistant');
  });
});

describe('RawEventPanel auto-scroll', () => {
  it('shows auto-scroll toggle button when streaming', () => {
    const { onSubscribe } = createSubscribe();
    render(<RawEventPanel onSubscribe={onSubscribe} onClose={vi.fn()} />);
    expect(screen.getByTitle('Auto-scroll')).toBeInTheDocument();
  });
});

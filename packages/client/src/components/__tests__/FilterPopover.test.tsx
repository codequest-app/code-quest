import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterPopover } from '../FilterPopover';

const entries = [
  { type: 'tool_use', count: 42 },
  { type: 'text', count: 38 },
  { type: 'error', count: 5 },
  { type: 'thinking', count: 1 },
];

const allSelected = new Set(['tool_use', 'text', 'error', 'thinking']);

function renderPopover(
  selected = allSelected,
  onChange = vi.fn(),
  labels?: Record<string, string>,
) {
  return render(
    <FilterPopover entries={entries} selected={selected} onChange={onChange} labels={labels} />,
  );
}

describe('FilterPopover', () => {
  it('renders entries sorted by count descending', () => {
    renderPopover();
    const items = screen.getAllByRole('checkbox');
    const labels = items.map((cb) => cb.closest('label')?.textContent ?? '');
    expect(labels[0]).toContain('tool_use');
    expect(labels[0]).toContain('42');
    expect(labels[1]).toContain('text');
    expect(labels[1]).toContain('38');
    expect(labels[2]).toContain('error');
    expect(labels[3]).toContain('thinking');
  });

  it('shows checked state for selected types', () => {
    renderPopover(new Set(['tool_use']));
    expect(screen.getByLabelText(/tool_use/)).toBeChecked();
    expect(screen.getByLabelText(/text/)).not.toBeChecked();
  });

  it('calls onChange with type added when checking an unchecked entry', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderPopover(new Set(['tool_use']), onChange);
    await user.click(screen.getByLabelText(/text/));
    const result = onChange.mock.calls[0][0] as Set<string>;
    expect(result.has('tool_use')).toBe(true);
    expect(result.has('text')).toBe(true);
  });

  it('calls onChange with type removed when unchecking a checked entry', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderPopover(allSelected, onChange);
    await user.click(screen.getByLabelText(/tool_use/));
    const result = onChange.mock.calls[0][0] as Set<string>;
    expect(result.has('tool_use')).toBe(false);
    expect(result.has('text')).toBe(true);
  });

  it('filters displayed entries by search input', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.type(screen.getByPlaceholderText(/filter/i), 'tool');
    expect(screen.getByLabelText(/tool_use/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/text/)).not.toBeInTheDocument();
  });

  it('shows all entries when search is cleared', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.type(screen.getByPlaceholderText(/filter/i), 'tool');
    await user.clear(screen.getByPlaceholderText(/filter/i));
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('Select All selects all visible entries', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderPopover(new Set(), onChange);
    await user.click(screen.getByRole('button', { name: /select all/i }));
    const result = onChange.mock.calls[0][0] as Set<string>;
    expect(result.size).toBe(4);
  });

  it('Clear All removes all visible entries from selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderPopover(allSelected, onChange);
    await user.click(screen.getByRole('button', { name: /clear all/i }));
    const result = onChange.mock.calls[0][0] as Set<string>;
    expect(result.size).toBe(0);
  });

  it('Select All on filtered list only adds visible entries', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderPopover(new Set(), onChange);
    await user.type(screen.getByPlaceholderText(/filter/i), 'tool');
    await user.click(screen.getByRole('button', { name: /select all/i }));
    const result = onChange.mock.calls[0][0] as Set<string>;
    expect(result.has('tool_use')).toBe(true);
    expect(result.has('text')).toBe(false);
  });

  it('Clear All removes all entries even when search is active', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderPopover(allSelected, onChange);
    await user.type(screen.getByPlaceholderText(/filter/i), 'tool');
    await user.click(screen.getByRole('button', { name: /clear all/i }));
    const result = onChange.mock.calls[0][0] as Set<string>;
    // All 4 entries cleared, not just 'tool_use'
    expect(result.size).toBe(0);
  });

  it('shows friendly label from labels map', () => {
    renderPopover(allSelected, vi.fn(), { tool_use: 'Tool Use' });
    expect(screen.getByLabelText(/Tool Use/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^tool_use/)).not.toBeInTheDocument();
  });

  it('shows raw type name when no label mapping', () => {
    renderPopover(allSelected, vi.fn(), {});
    expect(screen.getByLabelText(/tool_use/)).toBeInTheDocument();
  });
});

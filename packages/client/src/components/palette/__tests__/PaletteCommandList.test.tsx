import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '../../../lib/feature';
import { flatFilteredFeatures, PaletteCommandList } from '../PaletteCommandList';

const feat = (over: Partial<Feature> = {}): Feature => ({
  id: 'f',
  label: 'Feature',
  section: 'Settings',
  execute: vi.fn(),
  ...over,
});

function renderList(props: Partial<React.ComponentProps<typeof PaletteCommandList>> = {}) {
  const defaults = {
    features: [] as Feature[],
    query: '',
    activeId: null,
    onActiveChange: vi.fn(),
  };
  return render(<PaletteCommandList {...defaults} {...props} />);
}

describe('PaletteCommandList', () => {
  it('renders nothing when no features match', () => {
    const { container } = renderList({ features: [], query: '' });
    expect(container.firstChild).toBeNull();
  });

  it('groups features by section with section headers', () => {
    renderList({
      features: [
        feat({ id: 'a', label: 'A', section: 'Filters' }),
        feat({ id: 'b', label: 'B', section: 'Settings' }),
        feat({ id: 'c', label: 'C', section: 'Filters' }),
      ],
    });
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('preserves first-seen section order', () => {
    renderList({
      features: [feat({ id: 'a', section: 'Filters' }), feat({ id: 'b', section: 'Support' })],
    });
    const headers = screen.getAllByRole('heading', { level: 3 });
    expect(headers.map((h) => h.textContent)).toEqual(['Filters', 'Support']);
  });

  it('sorts within section by order asc', () => {
    renderList({
      features: [
        feat({ id: 'a', label: 'A', section: 'Customize', order: 2 }),
        feat({ id: 'b', label: 'B', section: 'Customize', order: 1 }),
        feat({ id: 'c', label: 'C', section: 'Customize' }), // undefined order → last
      ],
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['B', 'A', 'C']);
  });

  it('filters features by query (case-insensitive substring on label)', () => {
    renderList({
      features: [
        feat({ id: 'a', label: 'Switch theme', section: 'Settings' }),
        feat({ id: 'b', label: 'Toggle density', section: 'Settings' }),
      ],
      query: 'theme',
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Switch theme');
  });

  it('click on a row calls feature.execute by default', async () => {
    const execute = vi.fn();
    renderList({ features: [feat({ id: 'x', execute })] });
    await userEvent.click(screen.getByRole('button'));
    expect(execute).toHaveBeenCalledOnce();
  });

  it('onExecute prop overrides default feature.execute', async () => {
    const execute = vi.fn();
    const onExecute = vi.fn();
    const f = feat({ id: 'x', execute });
    renderList({ features: [f], onExecute });
    await userEvent.click(screen.getByRole('button'));
    expect(onExecute).toHaveBeenCalledWith(f);
    expect(execute).not.toHaveBeenCalled();
  });

  it('hover on row fires onActiveChange with feature id', async () => {
    const onActiveChange = vi.fn();
    renderList({
      features: [feat({ id: 'a' }), feat({ id: 'b' })],
      onActiveChange,
    });
    await userEvent.hover(screen.getAllByRole('button')[1]!);
    expect(onActiveChange).toHaveBeenCalledWith('b');
  });

  it('marks the active row with data-active attribute', () => {
    renderList({
      features: [feat({ id: 'a' }), feat({ id: 'b' })],
      activeId: 'b',
    });
    const [, second] = screen.getAllByRole('button');
    expect(second).toHaveAttribute('data-active');
  });

  it('flatFilteredFeatures returns features in render order (grouped by section, sorted by order)', () => {
    const features = [
      feat({ id: 'a', label: 'A', section: 'Customize', order: 2 }),
      feat({ id: 'b', label: 'B', section: 'Filters' }),
      feat({ id: 'c', label: 'C', section: 'Customize', order: 1 }),
    ];
    const result = flatFilteredFeatures(features, '');
    // Customize first-seen (a), then Filters (b). Within Customize: order 1 (c) before order 2 (a)
    expect(result.map((f) => f.id)).toEqual(['c', 'a', 'b']);
  });

  it('flatFilteredFeatures filters by query', () => {
    const features = [
      feat({ id: 'a', label: 'Switch theme', section: 'Settings' }),
      feat({ id: 'b', label: 'Toggle density', section: 'Settings' }),
    ];
    const result = flatFilteredFeatures(features, 'theme');
    expect(result.map((f) => f.id)).toEqual(['a']);
  });

  it('flatFilteredFeatures returns empty array when nothing matches', () => {
    const features = [feat({ id: 'a', label: 'A' })];
    expect(flatFilteredFeatures(features, 'zzz')).toEqual([]);
  });

  it('renders trailing from toPaletteCommand adapter (toggle state as ON pill)', () => {
    renderList({
      features: [
        feat({
          id: 'fm',
          label: 'Fast mode',
          state: { kind: 'toggle', active: true },
        }),
      ],
    });
    const pill = screen.getByRole('status', { name: 'fm-toggle' });
    expect(pill).toHaveAttribute('data-state', 'all');
    expect(pill.textContent).toBe('ON');
  });
});

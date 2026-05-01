import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Feature } from '@/lib/feature';
import { FeatureRow } from '../FeatureRow';

function makeGroupFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'tools',
    label: 'Tools',
    section: 'Filters',
    execute: () => {},
    state: {
      kind: 'group',
      items: [
        { value: 'tool_use', label: 'tool_use', preview: '', on: true, toggle: vi.fn() },
        { value: 'tool_result', label: 'tool_result', preview: '', on: false, toggle: vi.fn() },
      ],
    },
    ...overrides,
  };
}

describe('FeatureRow — flat feature (non-group)', () => {
  it('renders label and executes on click', async () => {
    const user = userEvent.setup();
    const execute = vi.fn();
    render(
      <FeatureRow
        feature={{
          id: 'x',
          label: 'Do thing',
          section: 'Settings',
          execute,
        }}
        isActive={false}
        onActiveChange={() => {}}
      />,
    );
    await user.click(screen.getByText('Do thing'));
    expect(execute).toHaveBeenCalledOnce();
  });
});

describe('FeatureRow — group feature composite row', () => {
  it('renders group-row-<id> wrapper with derived aggregate', () => {
    render(<FeatureRow feature={makeGroupFeature()} isActive={false} onActiveChange={() => {}} />);
    const row = screen.getByLabelText('group-row-tools');
    expect(row).toHaveAttribute('data-state', 'partial');
  });

  it('clicking group-label expands and reveals per-item rows', async () => {
    const user = userEvent.setup();
    render(<FeatureRow feature={makeGroupFeature()} isActive={false} onActiveChange={() => {}} />);
    expect(screen.queryByLabelText('type-pill-tool_use')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'group-label' }));
    expect(screen.getByLabelText('type-pill-tool_use')).toBeInTheDocument();
  });

  it('expanded type pill shows ON/OFF matching item.on', async () => {
    const user = userEvent.setup();
    render(<FeatureRow feature={makeGroupFeature()} isActive={false} onActiveChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'group-label' }));
    expect(screen.getByLabelText('type-pill-tool_use').textContent).toBe('ON');
    expect(screen.getByLabelText('type-pill-tool_result').textContent).toBe('OFF');
  });

  it('clicking a type pill calls that item.toggle()', async () => {
    const user = userEvent.setup();
    const toggleToolUse = vi.fn();
    const feature = makeGroupFeature({
      state: {
        kind: 'group',
        items: [
          { value: 'tool_use', label: 'tool_use', on: true, toggle: toggleToolUse },
          { value: 'tool_result', label: 'tool_result', on: false, toggle: vi.fn() },
        ],
      },
    });
    render(<FeatureRow feature={feature} isActive={false} onActiveChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'group-label' }));
    await user.click(screen.getByLabelText('type-pill-tool_use'));
    expect(toggleToolUse).toHaveBeenCalledOnce();
  });

  it('type row shows preview sample when provided', async () => {
    const user = userEvent.setup();
    const feature = makeGroupFeature({
      state: {
        kind: 'group',
        items: [
          {
            value: 'tool_use',
            label: 'tool_use',
            preview: 'Bash $ ls -la',
            on: true,
            toggle: vi.fn(),
          },
        ],
      },
    });
    render(<FeatureRow feature={feature} isActive={false} onActiveChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'group-label' }));
    expect(screen.getByLabelText('type-sample-tool_use').textContent).toContain('Bash $ ls -la');
  });

  it('group-toggle pill with partial aggregate + onPartial jumps (not toggle all)', async () => {
    const user = userEvent.setup();
    const onPartial = vi.fn();
    const toggleA = vi.fn();
    const toggleB = vi.fn();
    const feature = makeGroupFeature({
      state: {
        kind: 'group',
        items: [
          { value: 'a', label: 'A', on: true, toggle: toggleA },
          { value: 'b', label: 'B', on: false, toggle: toggleB },
        ],
        onPartial,
      },
    });
    render(<FeatureRow feature={feature} isActive={false} onActiveChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'group-toggle' }));
    expect(onPartial).toHaveBeenCalledOnce();
    expect(toggleA).not.toHaveBeenCalled();
    expect(toggleB).not.toHaveBeenCalled();
  });

  it('group-toggle pill with all=on aggregate toggles every item off', async () => {
    const user = userEvent.setup();
    const toggleA = vi.fn();
    const toggleB = vi.fn();
    const feature = makeGroupFeature({
      state: {
        kind: 'group',
        items: [
          { value: 'a', label: 'A', on: true, toggle: toggleA },
          { value: 'b', label: 'B', on: true, toggle: toggleB },
        ],
      },
    });
    render(<FeatureRow feature={feature} isActive={false} onActiveChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'group-toggle' }));
    expect(toggleA).toHaveBeenCalledOnce();
    expect(toggleB).toHaveBeenCalledOnce();
  });
});

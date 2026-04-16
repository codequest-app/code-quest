import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useMessageVisibilityStore } from '../../stores/useMessageVisibilityStore';
import { renderWithChannel } from '../../test/render-with-channel';
import { VisibilityGroupRow } from '../VisibilityGroupRow';

beforeEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));
afterEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));

describe('VisibilityGroupRow — expanded type rows', () => {
  it('expanded section shows each type as its own row (not inline pills)', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<VisibilityGroupRow groupId="tools" />);
    await user.click(screen.getByTestId('group-label'));

    // Each type should appear as a row with its own ON/OFF pill
    const typeRows = screen.getAllByTestId(/^type-row-/);
    expect(typeRows.length).toBeGreaterThan(0);
  });

  it('each type row has a toggle pill (ON/OFF)', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<VisibilityGroupRow groupId="tools" />);
    await user.click(screen.getByTestId('group-label'));

    // tool_use is in tools group and ON by default
    const pill = screen.getByTestId('type-pill-tool_use');
    expect(pill.textContent).toBe('ON');
  });

  it('clicking a type row pill toggles that type', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<VisibilityGroupRow groupId="tools" />);
    await user.click(screen.getByTestId('group-label'));

    const pill = screen.getByTestId('type-pill-tool_use');
    expect(pill.textContent).toBe('ON');
    await user.click(pill);
    expect(screen.getByTestId('type-pill-tool_use').textContent).toBe('OFF');
  });

  it('type row shows sample preview from most recent message of that type', async () => {
    const user = userEvent.setup();
    const ctx = await renderWithChannel(<VisibilityGroupRow groupId="conversation" />);
    await act(async () => {
      await ctx.claude.emit(s.assistant('Hello from the assistant'));
    });

    await user.click(screen.getByTestId('group-label'));

    // The text type row should show a preview of the most recent text message
    const sample = screen.getByTestId('type-sample-text');
    expect(sample.textContent).toContain('Hello from the assistant');
  });

  it('type row with no messages shows empty sample', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<VisibilityGroupRow groupId="tools" />);
    await user.click(screen.getByTestId('group-label'));

    // No messages emitted, sample should be empty
    const sample = screen.getByTestId('type-sample-tool_use');
    expect(sample.textContent).toBe('');
  });

  it('tool_use type row shows input as sample (not just tool name)', async () => {
    const user = userEvent.setup();
    const ctx = await renderWithChannel(<VisibilityGroupRow groupId="tools" />);
    await act(async () => {
      await ctx.claude.emit(
        s.assistant({ toolUse: { id: 'tu-1', name: 'Bash', input: { command: 'ls -la /src' } } }),
      );
    });

    await user.click(screen.getByTestId('group-label'));

    const sample = screen.getByTestId('type-sample-tool_use');
    expect(sample.textContent).toContain('ls -la');
  });
});

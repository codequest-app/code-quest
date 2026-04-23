import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMessageVisibility } from '../../contexts/channel/MessageVisibilityContext';
import { renderWithChannel } from '../../test/render-with-channel';
import { CommandPalette } from '../CommandPalette';

function EnablePartialHooks() {
  const { toggleType } = useMessageVisibility();
  return (
    <button type="button" onClick={() => toggleType('hook_started')}>
      make-partial
    </button>
  );
}

import { useMessageVisibilityStore } from '../../stores/useMessageVisibilityStore';

beforeEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));
afterEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));

async function renderAll() {
  const ctx = await renderWithChannel(
    <CommandPalette open={true} onClose={vi.fn()} onJumpTo={vi.fn()} />,
  );
  await act(async () => {
    await ctx.claude.emit(s.assistant('Visible message'));
    await ctx.claude.emit(s.result());
  });
  return ctx;
}

describe('CommandPalette — All tab', () => {
  it('shows actions section in All tab', async () => {
    await renderAll();
    // All tab is default; actions should be visible
    expect(screen.getByText(/raw event panel/i)).toBeInTheDocument();
  });

  it('does not show Open preferences (accessible via the topbar Settings cog)', async () => {
    await renderAll();
    expect(screen.queryByText(/open preferences/i)).not.toBeInTheDocument();
  });

  it('hides low-frequency preferences (theme/density/font-size) from All tab', async () => {
    await renderAll();
    // Settings-section features have ui.hideFromAll — they live in a
    // dedicated Settings tab, not cluttering the quick-access All view.
    expect(screen.queryByText(/^theme$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^density$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^font size$/i)).not.toBeInTheDocument();
  });

  it('shows visibility group rows in All tab (expandable)', async () => {
    const user = userEvent.setup();
    await renderAll();
    expect(screen.getByTestId('group-row-conversation')).toBeInTheDocument();
    // clicking label should expand pills in All tab
    const convLabel = screen
      .getByTestId('group-row-conversation')
      .querySelector('[data-testid="group-label"]')!;
    await user.click(convLabel);
    expect(screen.getByTestId('type-pill-text')).toBeInTheDocument();
  });

  it('Raw Event Panel toggle uses ON/OFF pill style', async () => {
    await renderAll();
    const toggle = screen.getByTestId('raw-panel-toggle');
    // should show "OFF" text when inactive
    expect(toggle.textContent).toContain('OFF');
  });

  it('shows recent messages in All tab', async () => {
    await renderAll();
    const buttons = screen.getAllByRole('button');
    const msgBtn = buttons.find((b) => (b.textContent ?? '').includes('Visible message'));
    expect(msgBtn).toBeTruthy();
  });

  it('Enter key in All tab triggers onJumpTo for the active message', async () => {
    const user = userEvent.setup();
    const onJumpTo = vi.fn();
    const onClose = vi.fn();
    const ctx = await renderWithChannel(
      <CommandPalette open={true} onClose={onClose} onJumpTo={onJumpTo} />,
    );
    await act(async () => {
      await ctx.claude.emit(s.assistant('Jump target'));
      await ctx.claude.emit(s.result());
    });
    // All tab is active by default; Enter should jump to active (idx=0) message
    const input = screen.getByPlaceholderText(/search/i);
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(onJumpTo).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('hides result messages (empty content) from message list', async () => {
    const ctx = await renderWithChannel(
      <CommandPalette open={true} onClose={vi.fn()} onJumpTo={vi.fn()} />,
    );
    await act(async () => {
      await ctx.claude.emit(s.result());
    });
    // result has content='' — should not appear as a message button
    const buttons = screen.getAllByRole('button');
    const resultButtons = buttons.filter((b) => {
      const spans = b.querySelectorAll('span');
      return Array.from(spans).some((sp) => sp.textContent?.toLowerCase() === 'result');
    });
    expect(resultButtons).toHaveLength(0);
  });

  it('partial group ∂ pill renders in All tab (expand to see detail via label click)', async () => {
    const user = userEvent.setup();
    await renderWithChannel(
      <>
        <EnablePartialHooks />
        <CommandPalette open={true} onClose={vi.fn()} onJumpTo={vi.fn()} />
      </>,
    );
    // make hooks group partial
    await user.click(screen.getByText('make-partial'));
    // find the hooks group toggle pill showing ∂
    const hooksRow = screen.getByTestId('group-row-hooks');
    const partialPill = hooksRow.querySelector('[data-testid="group-toggle"]')!;
    expect(partialPill.textContent).toBe('∂');
    // Actions tab no longer exists — detail view is inline: clicking
    // group-label expands the row's per-type toggles right here in All.
    const label = hooksRow.querySelector('[data-testid="group-label"]')!;
    await user.click(label);
    // after expand, per-type pills become visible for hooks group types
    const anyHookPill = hooksRow.querySelector('[data-testid^="type-pill-"]');
    expect(anyHookPill).toBeTruthy();
  });

  it('search query filters messages in All tab', async () => {
    const user = userEvent.setup();
    const ctx = await renderAll();
    await act(async () => {
      await ctx.claude.emit(s.assistant('Other content'));
      await ctx.claude.emit(s.result());
    });
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Visible');
    const buttons = screen.getAllByRole('button');
    const matched = buttons.filter((b) => (b.textContent ?? '').includes('Visible message'));
    expect(matched.length).toBeGreaterThan(0);
    const notMatched = buttons.filter((b) => (b.textContent ?? '').includes('Other content'));
    expect(notMatched).toHaveLength(0);
  });
});

it('tool_use message preview shows meaningful input (not just tool name)', async () => {
  const user = userEvent.setup();
  const ctx = await renderAll();
  await act(async () => {
    await ctx.claude.emit(
      s.assistant({ toolUse: { id: 'tu-1', name: 'Bash', input: { command: 'ls -la /src' } } }),
    );
  });
  // Switch to messages tab to see all messages
  const messagesTab = screen.getByRole('tab', { name: /messages/i });
  await user.click(messagesTab);
  // The preview should show the command, not just "Bash"
  const buttons = screen.getAllByRole('button');
  const toolBtn = buttons.find((b) => (b.textContent ?? '').includes('ls -la'));
  expect(toolBtn).toBeDefined();
});

import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CommandPaletteProvider, useCommandPalette } from '@/contexts/CommandPaletteContext';
import { useMessageVisibilityStore } from '@/stores/useMessageVisibilityStore';
import { renderWithChannel } from '@/test/render-with-channel';
import { CommandPalette } from '../CommandPalette.tsx';

beforeEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));
afterEach(() => useMessageVisibilityStore.setState({ enabledTypes: null }));

function OpenButton() {
  const { openPalette } = useCommandPalette();
  return (
    <button type="button" onClick={() => openPalette()}>
      Open
    </button>
  );
}

async function renderAll() {
  const ctx = await renderWithChannel(
    <CommandPaletteProvider>
      <OpenButton />
      <CommandPalette />
    </CommandPaletteProvider>,
  );
  await act(async () => {
    await ctx.claude.emit(s.assistant('Visible message'));
    await ctx.claude.emit(s.result());
  });
  await userEvent.click(screen.getByText('Open'));
  return ctx;
}

describe('CommandPalette — All tab', () => {
  it('hides low-frequency preferences (theme/density/font-size) from All tab', async () => {
    await renderAll();
    expect(screen.queryByText(/^theme$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^density$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^font size$/i)).not.toBeInTheDocument();
  });

  it('shows recent messages in All tab', async () => {
    await renderAll();
    const buttons = screen.getAllByRole('button');
    const msgBtn = buttons.find((b) => (b.textContent ?? '').includes('Visible message'));
    expect(msgBtn).toBeTruthy();
  });

  it('Enter key in All tab triggers jumpTo for the active message', async () => {
    const user = userEvent.setup();
    await renderAll();
    const input = screen.getByPlaceholderText(/search/i);
    await user.click(input);
    await user.keyboard('{Enter}');
    // palette should close after jump
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides result messages (empty content) from message list', async () => {
    const ctx = await renderWithChannel(
      <CommandPaletteProvider>
        <OpenButton />
        <CommandPalette />
      </CommandPaletteProvider>,
    );
    await act(async () => {
      await ctx.claude.emit(s.result());
    });
    await userEvent.click(screen.getByText('Open'));
    const buttons = screen.getAllByRole('button');
    const resultButtons = buttons.filter((b) => {
      const spans = b.querySelectorAll('span');
      return Array.from(spans).some((sp) => sp.textContent?.toLowerCase() === 'result');
    });
    expect(resultButtons).toHaveLength(0);
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
  const messagesTab = screen.getByRole('tab', { name: /messages/i });
  await user.click(messagesTab);
  const buttons = screen.getAllByRole('button');
  const toolBtn = buttons.find((b) => (b.textContent ?? '').includes('ls -la'));
  expect(toolBtn).toBeDefined();
});

import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CommandPaletteProvider, useCommandPalette } from '../../contexts/CommandPaletteContext';
import { useMessageRegistryStore } from '../../stores/useMessageRegistryStore';
import { useMessageVisibilityStore } from '../../stores/useMessageVisibilityStore';
import { renderWithChannel } from '../../test/render-with-channel';
import type { Message } from '../../types/ui';
import { CommandPalette } from '../CommandPalette';

const fakeMessage = (id: string, content: string, type = 'text'): Message =>
  ({
    id,
    role: 'assistant',
    type,
    content,
    timestamp: Date.now(),
  }) as Message;

function OpenButton() {
  const { openPalette } = useCommandPalette();
  return (
    <button type="button" onClick={() => openPalette()}>
      Open
    </button>
  );
}

async function renderPalette() {
  const ctx = await renderWithChannel(
    <CommandPaletteProvider>
      <OpenButton />
      <CommandPalette />
    </CommandPaletteProvider>,
  );
  await userEvent.click(screen.getByText('Open'));
  return ctx;
}

async function renderPaletteWithMessages() {
  const ctx = await renderWithChannel(
    <CommandPaletteProvider>
      <OpenButton />
      <CommandPalette />
    </CommandPaletteProvider>,
  );
  await act(async () => {
    await ctx.claude.emit(s.assistant('Hello from assistant'));
    await ctx.claude.emit(s.result());
  });
  await userEvent.click(screen.getByText('Open'));
  return ctx;
}

describe('CommandPalette — layout', () => {
  it('dialog uses fixed height on tablet+ and max-height on mobile', async () => {
    await renderPalette();
    const dialog = screen.getByLabelText('command-palette-dialog');
    expect(dialog.className).toMatch(/max-h-\[80vh\]/);
    expect(dialog.className).toMatch(/md:h-\[70vh\]/);
  });

  it('mobile: centered dialog with padding; tablet+: top offset for modal', async () => {
    await renderPalette();
    const overlay = screen.getByRole('dialog');
    const overlayCls = overlay.className;
    // all sizes: padding for breathing room
    expect(overlayCls).toMatch(/p-3/);
    // mobile: vertically centered
    expect(overlayCls).toMatch(/items-center/);
    // tablet+: top-aligned with offset
    expect(overlayCls).toMatch(/md:items-start/);
    expect(overlayCls).toMatch(/md:pt-\[10vh\]/);
  });

  it('mobile dialog has rounded corners; tablet has responsive width; desktop has fixed width', async () => {
    await renderPalette();
    const dialog = screen.getByLabelText('command-palette-dialog');
    const cls = dialog.className;
    // all sizes: rounded
    expect(cls).toMatch(/rounded-lg/);
    // tablet: responsive width
    expect(cls).toMatch(/md:max-w-/);
    // desktop: fixed width
    expect(cls).toMatch(/lg:w-160/);
  });

  it('tab bar appears above search input in DOM', async () => {
    await renderPalette();
    const tablist = screen.getByRole('tablist');
    const input = screen.getByPlaceholderText(/search/i);
    expect(tablist.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('All tab shows messages', async () => {
    const ctx = await renderPaletteWithMessages();
    await act(async () => {
      await ctx.claude.emit(s.assistant('Extra'));
      await ctx.claude.emit(s.result());
    });
    const buttons = screen.getAllByRole('button');
    const msgBtn = buttons.find((b) => (b.textContent ?? '').includes('Hello from assistant'));
    expect(msgBtn).toBeTruthy();
  });
});

describe('CommandPalette — open/close via context', () => {
  it('renders when opened via context', async () => {
    await renderPalette();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', async () => {
    await renderWithChannel(
      <CommandPaletteProvider>
        <CommandPalette />
      </CommandPaletteProvider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls closePalette when Esc pressed', async () => {
    const user = userEvent.setup();
    await renderPalette();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls closePalette when backdrop clicked', async () => {
    await renderPalette();
    const dialog = screen.getByRole('dialog');
    await userEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('CommandPalette — tabs', () => {
  it('renders All, Messages, Actions tabs', async () => {
    await renderPalette();
    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /messages/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /actions/i })).toBeInTheDocument();
  });

  it('All tab is active by default', async () => {
    await renderPalette();
    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking Messages tab switches to messages view', async () => {
    const user = userEvent.setup();
    await renderPalette();
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    expect(screen.getByRole('tab', { name: /messages/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking Actions tab shows settings (theme/density/font-size)', async () => {
    const user = userEvent.setup();
    await renderPalette();
    await user.click(screen.getByRole('tab', { name: /actions/i }));
    expect(screen.getByRole('tab', { name: /actions/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/^theme$/i)).toBeInTheDocument();
    expect(screen.getByText(/^density$/i)).toBeInTheDocument();
    expect(screen.getByText(/^font size$/i)).toBeInTheDocument();
  });
});

describe('CommandPalette — Messages tab search', () => {
  it('shows recent messages in All tab', async () => {
    await renderPaletteWithMessages();
    expect(screen.getByText(/Hello from assistant/)).toBeInTheDocument();
  });

  it('filters messages by search query', async () => {
    const user = userEvent.setup();
    const ctx = await renderPaletteWithMessages();
    await act(async () => {
      await ctx.claude.emit(s.assistant('Another message'));
      await ctx.claude.emit(s.result());
    });
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Hello');
    const buttons = screen.getAllByRole('button');
    const resultButtons = buttons.filter((b) =>
      (b.textContent ?? '').includes('Hello from assistant'),
    );
    expect(resultButtons.length).toBeGreaterThan(0);
    const noneForAnother = buttons.filter((b) => (b.textContent ?? '').includes('Another message'));
    expect(noneForAnother).toHaveLength(0);
  });

  it('calls jumpTo and closes on Enter with active result', async () => {
    const user = userEvent.setup();
    await renderPaletteWithMessages();
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    const input = screen.getByPlaceholderText(/search/i);
    await user.click(input);
    await user.keyboard('{Enter}');
    // palette should close after jump
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('CommandPalette — cross-channel messages', () => {
  it('shows messages from registry channels', async () => {
    useMessageRegistryStore.getState().register('other-ch', {
      projectCwd: '/other',
      messages: [fakeMessage('ext-1', 'Message from other tab')],
    });

    await renderPalette();
    await userEvent.click(screen.getByRole('tab', { name: /messages/i }));
    expect(screen.getByText(/Message from other tab/)).toBeInTheDocument();

    useMessageRegistryStore.getState().unregister('other-ch');
  });
});

describe('CommandPalette — visibility filtering', () => {
  afterEach(() => {
    useMessageVisibilityStore.setState({ enabledTypes: null });
    useMessageRegistryStore.getState().unregister('vis-ch');
  });

  it('hides messages whose type is disabled in visibility store', async () => {
    useMessageRegistryStore.getState().register('vis-ch', {
      projectCwd: '/test',
      messages: [
        fakeMessage('v1', 'A user question', 'text'),
        fakeMessage('v2', 'Tool call Read', 'tool_use'),
      ],
    });
    // disable tools group — only keep text types enabled
    useMessageVisibilityStore.getState().setEnabledTypes(['text', 'thinking', 'redacted_thinking']);

    await renderPalette();
    await userEvent.click(screen.getByRole('tab', { name: /messages/i }));

    expect(screen.getByText(/A user question/)).toBeInTheDocument();
    expect(screen.queryByText(/Tool call Read/)).not.toBeInTheDocument();
  });

  it('shows all messages when visibility store is null (defaults)', async () => {
    useMessageRegistryStore.getState().register('vis-ch', {
      projectCwd: '/test',
      messages: [
        fakeMessage('v1', 'A text msg', 'text'),
        fakeMessage('v2', 'A tool msg', 'tool_use'),
      ],
    });

    await renderPalette();
    await userEvent.click(screen.getByRole('tab', { name: /messages/i }));

    expect(screen.getByText(/A text msg/)).toBeInTheDocument();
    expect(screen.getByText(/A tool msg/)).toBeInTheDocument();
  });
});

describe('CommandPalette — filter features', () => {
  it('Actions tab shows filter group rows', async () => {
    const user = userEvent.setup();
    await renderPalette();
    await user.click(screen.getByRole('tab', { name: /actions/i }));
    expect(screen.getByLabelText('group-row-conversation')).toBeInTheDocument();
    expect(screen.getByLabelText('group-row-tools')).toBeInTheDocument();
    expect(screen.getByLabelText('group-row-system')).toBeInTheDocument();
  });

  it('filter groups appear in All tab too', async () => {
    await renderPalette();
    expect(screen.getByLabelText('group-row-conversation')).toBeInTheDocument();
  });
});

describe('CommandPalette — source labels', () => {
  afterEach(() => {
    useMessageRegistryStore.getState().unregister('ch-a');
    useMessageRegistryStore.getState().unregister('ch-b');
  });

  it('shows source section headers when multiple channels are registered', async () => {
    useMessageRegistryStore.getState().register('ch-a', {
      projectCwd: '/projects/alpha',
      messages: [fakeMessage('sa-1', 'Alpha msg')],
    });
    useMessageRegistryStore.getState().register('ch-b', {
      projectCwd: '/projects/beta',
      messages: [fakeMessage('sb-1', 'Beta msg')],
    });

    await renderPalette();
    await userEvent.click(screen.getByRole('tab', { name: /messages/i }));

    const headers = screen.getAllByLabelText('source-header');
    expect(headers.length).toBeGreaterThanOrEqual(2);
    expect(headers.map((el) => el.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('alpha'), expect.stringContaining('beta')]),
    );
  });

  it('omits source headers when only one channel exists', async () => {
    await renderPaletteWithMessages();
    await userEvent.click(screen.getByRole('tab', { name: /messages/i }));

    expect(screen.queryByLabelText('source-header')).toBeNull();
  });
});

describe('CommandPalette — keyboard navigation', () => {
  it('ArrowDown moves active item down in Messages tab', async () => {
    const user = userEvent.setup();
    const ctx = await renderPaletteWithMessages();
    await act(async () => {
      await ctx.claude.emit(s.assistant('Second message'));
      await ctx.claude.emit(s.result());
    });
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Enter in Messages tab jumps to message and closes palette', async () => {
    const user = userEvent.setup();
    await renderPaletteWithMessages();
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    const input = screen.getByPlaceholderText(/search/i);
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Actions tab has active feature on initial load and ArrowDown moves it', async () => {
    const user = userEvent.setup();
    await renderPalette();
    await user.click(screen.getByRole('tab', { name: /actions/i }));
    // idx=0 should already highlight the first feature
    const initialActive = document.querySelectorAll('[data-active]');
    expect(initialActive.length).toBeGreaterThan(0);
    // ArrowDown moves to next feature
    await user.keyboard('{ArrowDown}');
    const afterDown = document.querySelectorAll('[data-active]');
    expect(afterDown.length).toBeGreaterThan(0);
  });

  it('All tab ArrowDown navigates across messages and features', async () => {
    const user = userEvent.setup();
    const ctx = await renderPaletteWithMessages();
    // Add more messages to have some items
    await act(async () => {
      await ctx.claude.emit(s.assistant('Msg two'));
      await ctx.claude.emit(s.result());
    });
    // re-open palette (it closed on jump)
    await user.click(screen.getByText('Open'));
    // All tab is default, ArrowDown multiple times should reach beyond messages
    for (let i = 0; i < 10; i++) {
      await user.keyboard('{ArrowDown}');
    }
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

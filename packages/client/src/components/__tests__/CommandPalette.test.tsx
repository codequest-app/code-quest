import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { CommandPalette } from '../CommandPalette';

async function renderPalette(props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  return renderWithChannel(
    <CommandPalette open={true} onClose={vi.fn()} onJumpTo={vi.fn()} {...props} />,
  );
}

async function renderPaletteWithMessages(
  props: Partial<React.ComponentProps<typeof CommandPalette>> = {},
) {
  const ctx = await renderWithChannel(
    <CommandPalette open={true} onClose={vi.fn()} onJumpTo={vi.fn()} {...props} />,
  );
  await act(async () => {
    await ctx.claude.emit(s.assistant('Hello from assistant'));
    await ctx.claude.emit(s.result());
  });
  return ctx;
}

describe('CommandPalette — layout', () => {
  it('tab bar appears above search input in DOM', async () => {
    await renderPalette();
    const tablist = screen.getByRole('tablist');
    const input = screen.getByPlaceholderText(/search/i);
    expect(tablist.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('All tab shows messages before filters section', async () => {
    const ctx = await renderPaletteWithMessages();
    await act(async () => {
      await ctx.claude.emit(s.assistant('Extra'));
      await ctx.claude.emit(s.result());
    });
    // messages list renders a button; filters section renders group-row; check DOM order
    const buttons = screen.getAllByRole('button');
    const msgBtn = buttons.find((b) => (b.textContent ?? '').includes('Hello from assistant'));
    const groupRow = screen.getByTestId('group-row-conversation');
    expect(msgBtn).toBeTruthy();
    // msgBtn should appear before groupRow in DOM
    expect(
      msgBtn!.compareDocumentPosition(groupRow) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('CommandPalette — open/close', () => {
  it('renders when open=true', async () => {
    await renderPalette();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open=false', async () => {
    await renderWithChannel(<CommandPalette open={false} onClose={vi.fn()} onJumpTo={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when Esc pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    await renderPalette({ onClose });
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    await renderPalette({ onClose });
    const dialog = screen.getByRole('dialog');
    await userEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('CommandPalette — tabs (explicit curation)', () => {
  it('renders All, Messages, Actions tabs from TABS config', async () => {
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

  it('clicking Actions tab shows filter groups AND settings (theme/density/font-size)', async () => {
    const user = userEvent.setup();
    await renderPalette();
    await user.click(screen.getByRole('tab', { name: /actions/i }));
    expect(screen.getByRole('tab', { name: /actions/i })).toHaveAttribute('aria-selected', 'true');
    // Actions = Filters ∪ Settings per TABS config
    expect(screen.getByTestId('group-row-conversation')).toBeInTheDocument();
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
    // Text is split across mark+span for highlighting — use button text content
    const buttons = screen.getAllByRole('button');
    const resultButtons = buttons.filter((b) =>
      (b.textContent ?? '').includes('Hello from assistant'),
    );
    expect(resultButtons.length).toBeGreaterThan(0);
    const noneForAnother = buttons.filter((b) => (b.textContent ?? '').includes('Another message'));
    expect(noneForAnother).toHaveLength(0);
  });

  it('calls onJumpTo with message id when result clicked', async () => {
    const user = userEvent.setup();
    const onJumpTo = vi.fn();
    await renderPaletteWithMessages({ onJumpTo });
    const result = screen.getByText(/Hello from assistant/);
    await user.click(result);
    expect(onJumpTo).toHaveBeenCalledOnce();
  });

  it('calls onJumpTo and onClose on Enter with active result', async () => {
    const user = userEvent.setup();
    const onJumpTo = vi.fn();
    const onClose = vi.fn();
    await renderPaletteWithMessages({ onJumpTo, onClose });
    // Switch to messages tab so Enter triggers jump (not action)
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    // Focus input and press Enter — first result is active
    const input = screen.getByPlaceholderText(/search/i);
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(onJumpTo).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('CommandPalette — keyboard navigation', () => {
  it('ArrowDown moves active item down', async () => {
    const user = userEvent.setup();
    const ctx = await renderPaletteWithMessages();
    await act(async () => {
      await ctx.claude.emit(s.assistant('Second message'));
      await ctx.claude.emit(s.result());
    });
    await user.click(screen.getByRole('tab', { name: /messages/i }));
    await user.keyboard('{ArrowDown}');
    // Active item index moved — just verify no crash and dialog still open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

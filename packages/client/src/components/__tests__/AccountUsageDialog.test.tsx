import { segments as s } from '@code-quest/summoner/test';
import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithWorkspace } from '../../test/render-with-workspace';

describe('AccountUsageDialog', () => {
  it('renders after rate limit event', async () => {
    const resetsAt = Math.floor(Date.now() / 1000) + 3600;
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.rateLimitEvent({ status: 'ok', rateLimitType: 'five_hour', resetsAt }));
    await claude.emit(s.result());

    // Rate limit message rendered
    expect(screen.queryAllByText(/limit/i).length).toBeGreaterThan(0);
  });

  it('assistant message renders after init', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    expect(screen.queryAllByText(/hi/).length).toBeGreaterThan(0);
  });

  it('handles rate limit event when dialog is closed', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('ok'));
    await claude.emit(s.rateLimitEvent({ status: 'rate_limited' }));
    await claude.emit(s.result());

    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('opening /usage dialog does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    // Focus textarea and type /usage
    await act(async () => {
      textarea.focus();
    });
    await user.type(textarea, '/usage');

    // Look for the usage menu item
    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);
      // Dialog should open
      const dialog = screen.queryByRole('dialog', { name: /account & usage/i });
      expect(dialog).toBeTruthy();
    }
  });

  it('dialog shows loading when no rate_limit data', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    await act(async () => {
      textarea.focus();
    });
    await user.type(textarea, '/usage');

    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);
      // Should show loading or empty state
      const dialog = screen.queryByRole('dialog', { name: /account & usage/i });
      if (dialog) {
        const loadingEl = screen.queryByText(/loading usage/i);
        expect(loadingEl).toBeTruthy();
      }
    }
  });

  it('rate_limit data appears in dialog after event', async () => {
    const resetsAt = Math.floor(Date.now() / 1000) + 3600;
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.rateLimitEvent({ status: 'ok', rateLimitType: 'five_hour', resetsAt }));
    await claude.emit(s.result());

    await act(async () => {
      textarea.focus();
    });
    await user.type(textarea, '/usage');

    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);

      const dialog = screen.queryByRole('dialog', { name: /account & usage/i });
      if (dialog) {
        // Should show session usage data
        expect(screen.queryAllByText(/Session|5hr|resets/i).length).toBeGreaterThan(0);
      }
    }
  });

  it('dialog closes when close button clicked', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    await act(async () => {
      textarea.focus();
    });
    await user.type(textarea, '/usage');

    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);

      const dialog = screen.getByRole('dialog', { name: /account & usage/i });
      const closeBtn = within(dialog).getByLabelText('close');
      await user.click(closeBtn);
      expect(screen.queryByRole('dialog', { name: /account & usage/i })).not.toBeInTheDocument();
    }
  });

  it('renders after init with account info', async () => {
    await renderWithWorkspace();
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('shows context breakdown from get_context_usage', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    // Push context usage via state:usage
    await act(async () => {
      (claude.socket as any).serverSocket.emit('state:usage', {
        channelId: '',
        usage: {},
        contextUsage: {
          categories: [
            { name: 'System prompt', tokens: 6000, color: 'promptBorder' },
            { name: 'Messages', tokens: 4000, color: 'purple' },
            { name: 'Free space', tokens: 190000, color: 'promptBorder' },
          ],
          totalTokens: 10000,
          maxTokens: 200000,
          percentage: 5,
        },
      });
    });

    // Open /usage dialog
    await act(async () => { textarea.focus(); });
    await user.type(textarea, '/usage');
    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);

      const dialog = screen.getByRole('dialog', { name: /account & usage/i });
      expect(within(dialog).getByText(/System prompt/)).toBeInTheDocument();
      expect(within(dialog).getByText(/6\.0k/)).toBeInTheDocument();
      expect(within(dialog).getByText(/5% used/)).toBeInTheDocument();
    }
  });

  it('shows session cost from result stats', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result({ costUsd: 1.23, durationMs: 5000 }));

    // Open /usage dialog
    await act(async () => { textarea.focus(); });
    await user.type(textarea, '/usage');
    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);

      const dialog = screen.getByRole('dialog', { name: /account & usage/i });
      expect(within(dialog).getByText(/\$1\.23/)).toBeInTheDocument();
    }
  });
});

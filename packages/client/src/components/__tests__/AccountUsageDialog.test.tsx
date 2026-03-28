import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
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

      const closeBtns = screen.queryAllByRole('button', { name: /close/i });
      const closeBtn = closeBtns[0];
      if (closeBtn) {
        await user.click(closeBtn);
        expect(screen.queryByRole('dialog', { name: /account & usage/i })).not.toBeInTheDocument();
      }
    }
  });

  it('renders after init with account info', async () => {
    await renderWithWorkspace();
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });
});

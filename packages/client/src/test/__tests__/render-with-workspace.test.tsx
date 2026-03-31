import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithWorkspace } from '../render-with-workspace';

describe('renderWithWorkspace', () => {
  it('renders WorkspaceLayout with a new tab', async () => {
    await renderWithWorkspace();
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('returns claude and user', async () => {
    const { claude, user } = await renderWithWorkspace();
    expect(claude).toBeDefined();
    expect(claude.emit).toBeDefined();
    expect(user).toBeDefined();
  });

  it('claude.emit flushes React without explicit act()', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');

    await claude.emit(s.assistant('Reply from Claude'));
    await claude.emit(s.result());

    // getByText (not findByText) — proves flush happened synchronously after emit
    expect(screen.getByText(/Reply from Claude/)).toBeInTheDocument();
  });

  it('auto-generates title after first prompt and persists to DB', async () => {
    const { claude, channelId, user } = await renderWithWorkspace();

    claude.onControlRequest((req) => {
      if (req.subtype === 'generate_session_title') {
        return { title: 'Fix the login bug' };
      }
      return null;
    });

    // User sends a prompt
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'fix the login page');
    await user.keyboard('{Enter}');

    // CLI responds
    await claude.emit(s.assistant('ok'));
    await claude.emit(s.result());
    await new Promise<void>((r) => setTimeout(r, 100));

    // Tab title shows in UI (from first user message)
    const tab = screen.getByRole('tab', { selected: true });
    expect(tab).toHaveTextContent('fix the login page');

    // DB has CLI-generated title
    const sessionStore = claude.container.get<{
      getById(id: string): Promise<{ title?: string } | null>;
    }>(Symbol.for('SessionStore'));
    const record = await sessionStore.getById(channelId);
    expect(record).toBeDefined();
    expect(record!.title).toBe('Fix the login bug');
  });
});

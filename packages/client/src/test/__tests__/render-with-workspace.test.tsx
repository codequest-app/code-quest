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
});

import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emitAssistantTurn } from '../../test/helpers';
import { renderWithWorkspace } from '../../test/render-with-workspace';

describe('task_started event', () => {
  it('renders task description in DOM', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.taskStarted('toolu_1', 'Analyze code'));
    await emitAssistantTurn(claude, 'done');

    expect(screen.getByText(/Analyze code/)).toBeInTheDocument();
  });
});

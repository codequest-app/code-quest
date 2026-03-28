import { segments as s } from '@code-quest/summoner/test';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithWorkspace } from '../../test/render-with-workspace';

async function sendAndReceive(
  claude: { emit: (seg: string) => void },
  user: {
    click: (el: Element) => Promise<void>;
    type: (el: Element, text: string) => Promise<void>;
    keyboard: (key: string) => Promise<void>;
  },
) {
  const textarea = screen.getByPlaceholderText(/Esc to focus/i);
  await user.click(textarea);
  await user.type(textarea, 'hello');
  await user.keyboard('{Enter}');
  await claude.emit(s.assistant('hi'));
  await claude.emit(s.result());
}

describe('MessageActions', () => {
  it('shows action button on user messages', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    expect(screen.getByTitle('Message actions')).toBeInTheDocument();
  });

  it('action button count matches user message count', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    const actionButtons = screen.getAllByTitle('Message actions');
    expect(actionButtons).toHaveLength(1);
  });

  it('popup shows rewind option', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    await user.click(screen.getByTitle('Message actions'));

    expect(screen.getByText('Rewind code to here')).toBeInTheDocument();
  });

  it('popup shows fork option', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    await user.click(screen.getByTitle('Message actions'));

    expect(screen.getByText('Fork conversation from here')).toBeInTheDocument();
  });

  it('clicking rewind sends rewind_code to server', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    await user.click(screen.getByTitle('Message actions'));
    await user.click(screen.getByText('Rewind code to here'));

    // Server received the rewind request — popup closed after action
    expect(screen.queryByText('Rewind code to here')).not.toBeInTheDocument();
  });

  it('clicking fork sends fork_conversation to server', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    await user.click(screen.getByTitle('Message actions'));
    await user.click(screen.getByText('Fork conversation from here'));

    expect(screen.queryByText('Fork conversation from here')).not.toBeInTheDocument();
  });

  it('closing popup hides options', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendAndReceive(claude, user);

    await user.click(screen.getByTitle('Message actions'));
    expect(screen.getByText('Rewind code to here')).toBeInTheDocument();

    // Click elsewhere to close
    await user.click(document.body);

    expect(screen.queryByText('Rewind code to here')).not.toBeInTheDocument();
  });
});

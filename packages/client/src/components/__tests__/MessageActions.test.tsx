import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emitAssistantTurn, emitUserEcho, sendUserMessage } from '../../test/helpers';
import { renderWithWorkspace } from '../../test/render-with-workspace';

async function setupWithTurn() {
  const result = await renderWithWorkspace();
  const project = await result.addProject();
  await project.launchSession();
  await sendUserMessage(result.user, 'hello');
  await emitUserEcho(result.claude, 'hello');
  await emitAssistantTurn(result.claude);
  return result;
}

describe('MessageActions', () => {
  it('shows action button on user messages', async () => {
    await setupWithTurn();

    expect(screen.getByTitle('Message actions')).toBeInTheDocument();
  });

  it('action button count matches user message count', async () => {
    await setupWithTurn();

    const actionButtons = screen.getAllByTitle('Message actions');
    expect(actionButtons).toHaveLength(1);
  });

  it('popup shows rewind option', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));

    expect(screen.getByText('Rewind code to here')).toBeInTheDocument();
  });

  it('popup shows fork option', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));

    expect(screen.getByText('Fork conversation from here')).toBeInTheDocument();
  });

  it('clicking "Rewind code to here" opens a confirm dialog titled "Rewind code"', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));
    await user.click(screen.getByText('Rewind code to here'));

    const dialog = await screen.findByRole('dialog', { name: /^Rewind code$/ });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Never mind' })).toBeInTheDocument();
  });

  it('clicking fork sends fork_conversation to server', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));
    await user.click(screen.getByText('Fork conversation from here'));

    expect(screen.queryByText('Fork conversation from here')).not.toBeInTheDocument();
  });

  it('hides Fork option when message has no cliUuid (echo not received)', async () => {
    const result = await renderWithWorkspace();
    const project = await result.addProject();
    await project.launchSession();
    await sendUserMessage(result.user, 'hello');
    // NOTE: no emitUserEcho — message has no cliUuid
    await emitAssistantTurn(result.claude);

    await result.user.click(screen.getByTitle('Message actions'));

    expect(screen.queryByText('Fork conversation from here')).not.toBeInTheDocument();
    expect(screen.queryByText('Fork and rewind code')).not.toBeInTheDocument();
  });

  it('clicking "Fork and rewind code" opens a confirm dialog titled "Fork and rewind"', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));
    await user.click(screen.getByText('Fork and rewind code'));

    const dialog = await screen.findByRole('dialog', { name: /fork and rewind/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Never mind' })).toBeInTheDocument();
  });

  it('Never mind on fork-and-rewind dialog dismisses without forking', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));
    await user.click(screen.getByText('Fork and rewind code'));
    await screen.findByRole('dialog', { name: /fork and rewind/i });

    await user.click(screen.getByRole('button', { name: 'Never mind' }));

    expect(screen.queryByRole('dialog', { name: /fork and rewind/i })).not.toBeInTheDocument();
  });

  it('closing popup hides options', async () => {
    const { user } = await setupWithTurn();

    await user.click(screen.getByTitle('Message actions'));
    expect(screen.getByText('Rewind code to here')).toBeInTheDocument();

    // Click elsewhere to close
    await user.click(document.body);

    expect(screen.queryByText('Rewind code to here')).not.toBeInTheDocument();
  });
});

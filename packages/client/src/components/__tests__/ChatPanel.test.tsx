import { segments as s } from '@code-quest/summoner/test';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { renderWithChannel } from '../../test/render-with-channel';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ isOnboardingDismissed: true });
  });

  it('renders input and message list', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude')).toBeInTheDocument();
    expect(screen.getByTitle('Send')).toBeInTheDocument();
  });

  it('sends message — message appears in UI', async () => {
    await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    act(() => {
      fireEvent.change(textarea, { target: { value: 'test message' } });
      fireEvent.click(screen.getByTitle('Send'));
    });
    expect(screen.getByText('test message')).toBeInTheDocument();
    expect(screen.getByTitle('Stop')).toBeInTheDocument();
  });

  it('displays messages from pipeline', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'Hello{Enter}');
    await claude.emit(s.assistant('Hi back'));
    await claude.emit(s.result());
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi back/)).toBeInTheDocument();
  });

  it('shows control request banner when pending', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
    );
    await claude.emit(s.controlRequestBash('r1', { command: 'ls' }));
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('renders HeaderBar with connection status', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByText(/connected|disconnected/i)).toBeInTheDocument();
  });

  it('keeps input enabled when processing', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude')).toBeEnabled();
  });

  it('shows Stop button when processing', async () => {
    await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    expect(screen.getByTitle('Stop')).toBeInTheDocument();
  });

  it('shows session title in HeaderBar when title is set', async () => {
    await renderWithChannel(<ChatPanel title="Fix the login bug" />);
    expect(screen.getByText('Fix the login bug')).toBeInTheDocument();
  });

  it('does not render TabBar', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  // ── Control flow pipeline ──

  it('tool_use interrupts streaming — text after tool_result still renders', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(s.textDelta('Before tool'));
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
    await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));

    const yesButton = await screen.findByText('Yes');
    await userEvent.click(yesButton);

    await claude.emit(s.toolResult('toolu_1', 'file content'));
    await claude.emit(s.assistant('After tool'));
    await claude.emit(s.result());

    expect(await screen.findByText(/Before tool/)).toBeInTheDocument();
    expect(await screen.findByText(/After tool/)).toBeInTheDocument();
  });

  it('tool_result flows through pipeline (verified via received)', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
    await claude.emit(s.controlRequest('r1', 'can_use_tool', 'Read', {}));

    const yesButton = await screen.findByText('Yes');
    await userEvent.click(yesButton);

    await claude.emit(s.toolResult('toolu_1', 'file contents'));
    await claude.emit(s.assistant('Done'));
    await claude.emit(s.result());

    expect(await screen.findByText(/Done/)).toBeInTheDocument();
    expect(claude.received('control_response').length).toBeGreaterThan(0);
  });

  it('elicitation control_request renders dialog', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(s.controlRequestElicitation('elic-1', { message: 'Please confirm' }));

    expect(screen.queryAllByText(/confirm/i).length).toBeGreaterThan(0);
  });

  it('chat:cancel_request shows "Cancelled" feedback in DOM', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'bash', input: {} } }));
    await claude.emit(s.controlRequest('r1', 'can_use_tool', 'bash', {}));
    await claude.emit(s.controlCancelRequest('r1'));
    await claude.emit(s.result());

    expect(screen.queryAllByText(/Cancelled/i).length).toBeGreaterThan(0);
  });

  it('notification error shows message in UI', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(
      s.controlRequestShowNotification('notif-1', {
        message: 'Something went wrong',
        severity: 'error',
      }),
    );

    expect(screen.queryAllByText(/Something went wrong|error/i).length).toBeGreaterThan(0);
  });

  it('notification warning shows message in UI', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(
      s.controlRequestShowNotification('notif-2', { message: 'Be careful', severity: 'warning' }),
    );

    expect(screen.queryAllByText(/Be careful|warning/i).length).toBeGreaterThan(0);
  });

  it('notification with buttons shows in UI', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(
      s.controlRequestShowNotification('notif-3', {
        message: 'Retry?',
        severity: 'info',
        buttons: ['Retry'],
      }),
    );

    expect(screen.queryAllByText(/Retry/i).length).toBeGreaterThan(0);
  });

  it('open_diff control_request does not crash', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(
      s.controlRequestOpenDiff('diff-1', {
        originalFilePath: '/tmp/old.ts',
        newFilePath: '/tmp/new.ts',
      }),
    );

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('diffRespond with unknown toolId does not crash', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText('⌘ Esc to focus or unfocus Claude');
    await userEvent.type(textarea, 'go{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(
      s.controlRequestOpenDiff('diff-gone', { originalFilePath: '/tmp/a', newFilePath: '/tmp/b' }),
    );
    await claude.emit(s.controlCancelRequest('diff-gone'));

    expect(screen.getByText('hi')).toBeInTheDocument();
  });
});

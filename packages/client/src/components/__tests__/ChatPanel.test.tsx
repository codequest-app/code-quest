import { segments as s } from '@code-quest/summoner/test';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { COMPOSE_PLACEHOLDER, emitAssistantTurn } from '../../test/helpers';
import { renderWithChannel } from '../../test/render-with-channel';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  it('renders input and message list', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByTitle('Send')).toBeInTheDocument();
  });

  it('sends message — message appears in UI', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await user.type(textarea, 'test message');
    await user.click(screen.getByTitle('Send'));
    expect(screen.getByText('test message')).toBeInTheDocument();
    expect(screen.getByTitle('Stop')).toBeInTheDocument();
  });

  it('displays messages from pipeline', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'Hello{Enter}');
    await emitAssistantTurn(claude, 'Hi back');
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(/Hi back/)).toBeInTheDocument();
  });

  it('shows control request banner when pending', async () => {
    const { claude } = await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await userEvent.type(textarea, 'go{Enter}');
    await act(async () => {
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
      );
      await claude.emit(s.controlRequestBash('r1', { command: 'ls' }));
    });
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('renders HeaderBar with model info', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('keeps input enabled when processing', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeEnabled();
  });

  it('shows Stop button when processing', async () => {
    await renderWithChannel(<ChatPanel />);
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
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

  it('shows Session history button in HeaderBar', async () => {
    await renderWithChannel(<ChatPanel />);
    expect(screen.getByTitle('Session history')).toBeInTheDocument();
  });

  it('clicking Session history button opens resume overlay', async () => {
    const user = userEvent.setup();
    await renderWithChannel(<ChatPanel />);
    await user.click(screen.getByTitle('Session history'));
    // SessionDialog renders when overlay is open
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  describe('control flow pipeline', () => {
    it('tool_use interrupts streaming — text after tool_result still renders', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(s.textDelta('Before tool'));
        await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
        await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));
      });

      const yesButton = await screen.findByText('Yes');
      await userEvent.click(yesButton);

      await act(async () => {
        await claude.emit(s.toolResult('toolu_1', 'file content'));
      });
      await emitAssistantTurn(claude, 'After tool');

      expect(await screen.findByText(/Before tool/)).toBeInTheDocument();
      expect(await screen.findByText(/After tool/)).toBeInTheDocument();
    });

    it('tool_result flows through pipeline (verified via received)', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
        await claude.emit(s.controlRequest('r1', 'can_use_tool', 'Read', {}));
      });

      const yesButton = await screen.findByText('Yes');
      await userEvent.click(yesButton);

      await act(async () => {
        await claude.emit(s.toolResult('toolu_1', 'file contents'));
      });
      await emitAssistantTurn(claude, 'Done');

      expect(await screen.findByText(/Done/)).toBeInTheDocument();
      expect(claude.received('control_response').length).toBeGreaterThan(0);
    });

    it('elicitation control_request renders dialog', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(s.controlRequestElicitation('elic-1', { message: 'Please confirm' }));
      });

      expect(screen.queryAllByText(/confirm/i).length).toBeGreaterThan(0);
    });

    it('chat:cancel_request silently removes pending control banner', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'bash', input: {} } }));
        await claude.emit(s.controlRequest('r1', 'can_use_tool', 'bash', {}));
      });

      expect(screen.getByText('Yes')).toBeInTheDocument();

      await act(async () => {
        await claude.emit(s.controlCancelRequest('r1'));
        await claude.emit(s.result());
      });

      // Banner removed, no "Cancelled" text shown
      expect(screen.queryByText('Yes')).not.toBeInTheDocument();
      expect(screen.queryAllByText(/Cancelled/i)).toHaveLength(0);
    });

    it('notification error shows message in UI', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(
          s.controlRequestShowNotification('notif-1', {
            message: 'Something went wrong',
            severity: 'error',
          }),
        );
      });

      expect(screen.queryAllByText(/Something went wrong|error/i).length).toBeGreaterThan(0);
    });

    it('notification warning shows message in UI', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(
          s.controlRequestShowNotification('notif-2', {
            message: 'Be careful',
            severity: 'warning',
          }),
        );
      });

      expect(screen.queryAllByText(/Be careful|warning/i).length).toBeGreaterThan(0);
    });

    it('notification with buttons shows in UI', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await act(async () => {
        await claude.emit(
          s.controlRequestShowNotification('notif-3', {
            message: 'Retry?',
            severity: 'info',
            buttons: ['Retry'],
          }),
        );
      });

      expect(screen.queryAllByText(/Retry/i).length).toBeGreaterThan(0);
    });

    it('open_diff control_request does not crash', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await emitAssistantTurn(claude);
      await act(async () => {
        await claude.emit(
          s.controlRequestOpenDiff('diff-1', {
            originalFilePath: '/tmp/old.ts',
            newFilePath: '/tmp/new.ts',
          }),
        );
      });

      expect(screen.getByText('hi')).toBeInTheDocument();
    });
  });

  describe('message:result pipeline', () => {
    it('message:result transitions from Stop to Send button (processing → idle)', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      expect(screen.getByTitle('Stop')).toBeInTheDocument();

      await emitAssistantTurn(claude, 'done');

      expect(await screen.findByTitle('Send')).toBeInTheDocument();
    });

    it('message:result with error shows error message', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');

      await act(async () => {
        await claude.emit(s.resultError({ errors: ['Something failed'] }));
      });

      expect((await screen.findAllByText(/Something failed/)).length).toBeGreaterThan(0);
      expect(await screen.findByTitle('Send')).toBeInTheDocument();
    });

    it('streaming text deltas accumulate and result returns to idle', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');

      await act(async () => {
        await claude.emit(s.textDelta('Hello '));
        await claude.emit(s.textDelta('World'));
      });
      await emitAssistantTurn(claude, 'Hello World');

      expect(await screen.findByTitle('Send')).toBeInTheDocument();
    });

    it('diffRespond with unknown toolId does not crash', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />);
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.type(textarea, 'go{Enter}');
      await emitAssistantTurn(claude);
      await act(async () => {
        await claude.emit(
          s.controlRequestOpenDiff('diff-gone', {
            originalFilePath: '/tmp/a',
            newFilePath: '/tmp/b',
          }),
        );
        await claude.emit(s.controlCancelRequest('diff-gone'));
      });

      expect(screen.getByText('hi')).toBeInTheDocument();
    });
  });

  describe('/compact slash command', () => {
    it('sends /compact to CLI', async () => {
      const user = userEvent.setup();
      const { claude } = await renderWithChannel(<ChatPanel />);

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await user.type(textarea, '/compact');
      await user.click(screen.getByTitle('Send'));

      expect(claude.received('user')).toHaveLength(1);
      expect(claude.received('user')[0]).toMatchObject({
        message: { content: [{ text: '/compact' }] },
      });
    });

    it('sends /compact with argument to CLI', async () => {
      const user = userEvent.setup();
      const { claude } = await renderWithChannel(<ChatPanel />);

      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await user.type(textarea, '/compact 50');
      await user.click(screen.getByTitle('Send'));

      expect(claude.received('user')).toHaveLength(1);
      expect(claude.received('user')[0]).toMatchObject({
        message: { content: [{ text: '/compact 50' }] },
      });
    });
  });

  describe('/reload-plugins slash command', () => {
    it('selecting /reload-plugins from slash menu does not send chat message to CLI', async () => {
      const { claude } = await renderWithChannel(<ChatPanel />, {
        initSegment: s.init('sess', { slashCommands: ['reload-plugins'] }),
      });

      // Open slash menu by typing / then select /reload-plugins
      const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
      await userEvent.click(textarea);
      await userEvent.keyboard('/');
      const slashSection = await screen.findByRole('group', { name: 'Slash Commands' });
      const reloadItem = within(slashSection).getByText('/reload-plugins');
      await userEvent.click(reloadItem);

      expect(claude.received('user')).toHaveLength(0);
    });
  });
});

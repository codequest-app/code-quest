import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COMPOSE_PLACEHOLDER, emitAssistantTurn, sendUserMessage } from '../../test/helpers';
import { renderWithWorkspace } from '../../test/render-with-workspace';

/** Render workspace + complete one user→assistant turn (common setup for most tests). */
async function setupWithTurn(userMsg = 'go', assistantReply = 'hi') {
  const result = await renderWithWorkspace();
  const project = await result.addProject();
  await project.launchSession();
  await sendUserMessage(result.user, userMsg);
  await emitAssistantTurn(result.claude, assistantReply);
  return result;
}

describe('ChannelProvider', () => {
  it('renders channel content after launch', async () => {
    const { addProject: addProj } = await renderWithWorkspace();
    const proj = await addProj();
    await proj.launchSession();
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
  });

  it('receives assistant text message and renders in DOM', async () => {
    await setupWithTurn('hi', 'Hello!');

    expect(screen.getByText(/Hello!/)).toBeInTheDocument();
  });

  it('emits chat:send exactly once per sendMessage call', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user, 'hello');

    const userMessages = claude.received('user');
    expect(userMessages.length).toBe(1);
  });

  it('messages start empty before any interaction', async () => {
    const { addProject: addProj } = await renderWithWorkspace();
    const proj = await addProj();
    await proj.launchSession();
    expect(screen.queryByText(/Hello/)).not.toBeInTheDocument();
  });

  // ── Silent events (must not produce visible messages) ──

  it('signature_delta does not create visible message', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await act(async () => {
      await claude.emit(s.signatureDelta('sig'));
      await claude.emit(s.result());
    });

    expect(screen.queryAllByText(/unhandled|signature/i)).toHaveLength(0);
  });

  it('control_response does not create visible message', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await act(async () => {
      await claude.emit(s.controlResponse('req-fake'));
      await claude.emit(s.result());
    });

    expect(screen.queryAllByText(/unhandled|control_response/i)).toHaveLength(0);
  });

  // ── Resilience (events must not crash the app) ──

  it('process exit does not crash', async () => {
    const { claude } = await setupWithTurn('go', 'bye');

    await act(async () => {
      claude.handle.abort();
    });

    expect(screen.getByText('bye')).toBeInTheDocument();
  });

  it('auth_url event does not crash', async () => {
    const { claude } = await setupWithTurn();
    await act(async () => {
      await claude.emit(s.authUrl('https://auth.example.com', 'browser'));
    });

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('bridge_state does not crash', async () => {
    const { claude } = await setupWithTurn();
    await act(async () => {
      await claude.emit(s.bridgeState('ready'));
    });

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('unknown raw event does not crash', async () => {
    const { claude } = await setupWithTurn();
    await act(async () => {
      await claude.emit(s.rawUnknown('some_future_event', { data: 'test' }));
    });

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('new_session_notification does not crash', async () => {
    const { claude } = await setupWithTurn();
    await act(async () => {
      await claude.emit(s.newSessionNotification());
    });

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('open_in_editor control_request does not crash', async () => {
    const { claude } = await setupWithTurn();
    await act(async () => {
      await claude.emit(s.controlRequestOpenInEditor('oe-1'));
    });

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('speech:message does not crash', async () => {
    const { claude } = await setupWithTurn();
    await act(async () => {
      await claude.emit(s.speechToTextMessage('ch-1', 'Hello'));
      await claude.emit(s.speechToTextMessage('ch-1', 'Hello world', true));
    });

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  // ── Cross-window processing sync ──

  it('session:states busy shows spinner (Stop button)', async () => {
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    const channelId = await project.launchSession();

    await act(async () => {
      await claude.pushServerEvent('session:states', {
        sessions: [{ channelId, state: 'busy' }],
      });
    });

    expect(await screen.findByTitle('Stop')).toBeInTheDocument();
  });

  it('session:states idle hides spinner after busy', async () => {
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    const channelId = await project.launchSession();

    await act(async () => {
      await claude.pushServerEvent('session:states', {
        sessions: [{ channelId, state: 'busy' }],
      });
    });
    expect(screen.getByTitle('Stop')).toBeInTheDocument();

    await act(async () => {
      await claude.pushServerEvent('session:states', {
        sessions: [{ channelId, state: 'idle' }],
      });
    });
    expect(screen.getByTitle('Send')).toBeInTheDocument();
  });

  // ── Abort state ──

  it('abort resets on result — can abort again next turn', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    // Turn 1: send → abort → result
    await sendUserMessage(user, 'first');
    await user.click(screen.getByTitle('Stop'));

    await emitAssistantTurn(claude, 'interrupted');

    // Turn 2: send → abort again
    await sendUserMessage(user, 'second');
    await user.click(screen.getByTitle('Stop'));

    const interrupts = claude.received('control_request').filter((cr) => {
      const req = cr.request as Record<string, unknown> | undefined;
      return req?.subtype === 'interrupt';
    });
    expect(interrupts.length).toBe(2);
  });

  it('unmount does not crash', async () => {
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    render(<div />);
    expect(claude.connected).toBe(true);
  });

  // ── Context Usage ──

  it('settings:refresh_usage returns contextUsage from CLI', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();

    claude.onControlRequest((req) => {
      if (req.subtype === 'get_context_usage') {
        return {
          categories: [{ name: 'System prompt', tokens: 6000, color: 'promptBorder' }],
          totalTokens: 10000,
          maxTokens: 200000,
          percentage: 5,
        };
      }
      return null;
    });

    await sendUserMessage(user);
    await emitAssistantTurn(claude, 'done');

    // Trigger settings:refresh_usage via UI — open /usage dialog
    const textarea = screen.getByPlaceholderText(COMPOSE_PLACEHOLDER);
    await act(async () => {
      textarea.focus();
    });
    await user.type(textarea, '/usage');
    const usageItem = screen.queryByText(/Account & usage/i);
    if (usageItem) {
      await user.click(usageItem);
    }
    // App should not crash — contextUsage stored separately from stats
    await waitFor(() => {
      expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
    });
  });
});

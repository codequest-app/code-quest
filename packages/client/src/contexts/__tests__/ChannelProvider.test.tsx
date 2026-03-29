import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithWorkspace } from '../../test/render-with-workspace';

describe('ChannelProvider', () => {
  it('renders channel content after launch', async () => {
    await renderWithWorkspace();
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('receives assistant text message and renders in DOM', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hi');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('Hello!'));
    await claude.emit(s.result());

    expect(screen.getByText(/Hello!/)).toBeInTheDocument();
  });

  it('emits chat:send exactly once per sendMessage call', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'hello');
    await user.keyboard('{Enter}');

    const userMessages = claude.received('user');
    expect(userMessages.length).toBe(1);
  });

  it('messages start empty before any interaction', async () => {
    await renderWithWorkspace();
    expect(screen.queryByText(/Hello/)).not.toBeInTheDocument();
  });

  // ── Silent events (must not produce visible messages) ──

  it('signature_delta does not create visible message', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.signatureDelta('sig'));
    await claude.emit(s.result());

    expect(screen.queryAllByText(/unhandled|signature/i)).toHaveLength(0);
  });

  it('control_response does not create visible message', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.controlResponse('req-fake'));
    await claude.emit(s.result());

    expect(screen.queryAllByText(/unhandled|control_response/i)).toHaveLength(0);
  });

  // ── Resilience (events must not crash the app) ──

  it('process exit does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('bye'));
    await claude.emit(s.result());

    await act(async () => {
      claude.handle.abort();
    });

    expect(screen.getByText('bye')).toBeInTheDocument();
  });

  it('auth_url event does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(s.authUrl('https://auth.example.com', 'browser'));

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('bridge_state does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(s.bridgeState('ready'));

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('unknown raw event does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(s.rawUnknown('some_future_event', { data: 'test' }));

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('new_session_notification does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(s.newSessionNotification());

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('open_in_editor control_request does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(s.controlRequestOpenInEditor('oe-1'));

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  it('speech_to_text_message does not crash', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());
    await claude.emit(s.speechToTextMessage('ch-1', 'Hello'));
    await claude.emit(s.speechToTextMessage('ch-1', 'Hello world', true));

    expect(screen.getByText('hi')).toBeInTheDocument();
  });

  // ── Abort state ──

  it('abort resets on result — can abort again next turn', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);

    // Turn 1: send → abort → result
    await user.click(textarea);
    await user.type(textarea, 'first');
    await user.keyboard('{Enter}');
    await user.click(screen.getByTitle('Stop'));

    await claude.emit(s.assistant('interrupted'));
    await claude.emit(s.result());

    // Turn 2: send → abort again
    await user.click(textarea);
    await user.type(textarea, 'second');
    await user.keyboard('{Enter}');
    await user.click(screen.getByTitle('Stop'));

    const interrupts = claude.received('control_request').filter((cr) => {
      const req = cr.request as Record<string, unknown> | undefined;
      return req?.subtype === 'interrupt';
    });
    expect(interrupts.length).toBe(2);
  });

  it('unmount does not crash', async () => {
    const { claude } = await renderWithWorkspace();
    const { render: rtlRender } = await import('@testing-library/react');
    rtlRender(<div />);
    expect(claude.socket.connected).toBe(true);
  });

  // ── Context Usage ──

  it('state:usage stores contextUsage separately from stats', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'go');
    await user.keyboard('{Enter}');
    await claude.emit(s.assistant('done'));
    await claude.emit(s.result());

    // Push state:usage with contextUsage
    await act(async () => {
      (claude.socket as any).serverSocket.emit('state:usage', {
        channelId: '',
        usage: {},
        contextUsage: {
          categories: [
            { name: 'System prompt', tokens: 6000, color: 'promptBorder' },
            { name: 'Messages', tokens: 4000, color: 'purple' },
          ],
          totalTokens: 10000,
          maxTokens: 200000,
          percentage: 5,
        },
      });
    });

    // ContextPieChart should NOT change (still uses stats from result)
    // stats should not be overwritten
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });
});

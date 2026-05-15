import { EVENTS } from '@code-quest/schemas';
import { segments as s } from '@code-quest/test-kit';
import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COMPOSE_PLACEHOLDER, emitAssistantTurn, sendUserMessage } from '@/test/helpers';
import { renderWithWorkspace } from '@/test/render-with-workspace';

/** Render workspace + complete one user→assistant turn (common setup for most tests). */
async function setupWithTurn(userMsg = 'go', assistantReply = 'hi') {
  const result = await renderWithWorkspace();
  const project = await result.addProject();
  await project.launchSession();
  await sendUserMessage(result.user, userMsg);
  await emitAssistantTurn(result.claude, assistantReply);
  return { ...result, summoner: result.summoner };
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
      await claude.emitSegment(s.signatureDelta('sig'));
      await claude.emitSegment(s.result());
    });

    expect(screen.queryAllByText(/unhandled|signature/i)).toHaveLength(0);
  });

  it('control_response does not create visible message', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await act(async () => {
      await claude.emitSegment(s.controlResponse('req-fake'));
      await claude.emitSegment(s.result());
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

  // ── Cross-window processing sync ──

  it('sending message shows Stop button (busy state)', async () => {
    const { user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();

    await sendUserMessage(user, 'hello');

    expect(await screen.findByTitle('Stop')).toBeInTheDocument();
  });

  it('result returns to Send button (idle state)', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();

    await sendUserMessage(user, 'hello');
    expect(await screen.findByTitle('Stop')).toBeInTheDocument();

    await emitAssistantTurn(claude, 'done');
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

    const interrupts = claude
      .received('control_request')
      .filter((cr) => cr.request.subtype === 'interrupt');
    expect(interrupts.length).toBe(2);
  });

  it('unmount cleans up without errors', async () => {
    const { addProject, unmount } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    expect(screen.getByPlaceholderText(COMPOSE_PLACEHOLDER)).toBeInTheDocument();
    unmount();
    expect(screen.queryByPlaceholderText(COMPOSE_PLACEHOLDER)).not.toBeInTheDocument();
  });

  // ── state:refresh_required ──

  describe('state:refresh_required', () => {
    it('re-joins session after state:refresh_required and restores history', async () => {
      const { claude, summoner } = await setupWithTurn('hello', 'world');

      expect(screen.getByText('world')).toBeInTheDocument();
      const joinsBefore = summoner.sentEvents('session:join').length;

      await act(async () => {
        claude.pushServerEvent(EVENTS.state.refresh_required, {});
      });

      // session:join must be sent again (clear + rejoin cycle)
      await waitFor(() => {
        expect(summoner.sentEvents('session:join').length).toBeGreaterThan(joinsBefore);
      });

      // history is restored — messages visible again
      expect(screen.getByText('world')).toBeInTheDocument();
    });
  });
});

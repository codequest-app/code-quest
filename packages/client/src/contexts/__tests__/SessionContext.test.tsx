import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';
import { emitAssistantTurn, sendUserMessage } from '../../test/helpers';
import { renderWithWorkspace } from '../../test/render-with-workspace';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('SessionProvider (global config only)', () => {
  it('renders UI after connect and launch', async () => {
    const { addProject: addProj } = await renderWithWorkspace();
    const proj = await addProj();
    await proj.launchSession();
    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('settings:update config updates are processed without crash', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await emitAssistantTurn(claude);

    expect(screen.queryAllByText(/hi/).length).toBeGreaterThan(0);
  });

  it('experiment_gates event does not crash', async () => {
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await act(async () => {
      await claude.emit(s.experimentGates({ review_upsell: true }));
    });

    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('disconnect shows toast warning', async () => {
    const mockedToast = vi.mocked(toast);
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();

    await act(async () => {
      claude.disconnect();
    });

    expect(mockedToast.warning).toHaveBeenCalledWith('Disconnected from server');
  });

  it('connect_error shows toast error', async () => {
    const mockedToast = vi.mocked(toast);
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();

    // Manually invoke the connect_error listener registered by SessionContext
    const listeners = claude.listeners('connect_error');
    await act(async () => {
      for (const fn of listeners) (fn as (err: Error) => void)(new Error('Connection refused'));
    });

    expect(mockedToast.error).toHaveBeenCalledWith(expect.stringContaining('Connection refused'));
  });

  it('does not crash on reconnect', async () => {
    const { claude, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();

    await act(async () => {
      claude.disconnect();
    });
    await act(async () => {
      claude.connect();
    });

    expect(claude.connected).toBe(true);
  });
});

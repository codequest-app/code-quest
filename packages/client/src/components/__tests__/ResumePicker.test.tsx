import {
  createFakeServer,
  createTestContainer,
  type SessionStore,
  TYPES,
} from '@code-quest/server/test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ResumeProvider } from '../../contexts/ResumeContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { ResumePicker } from '../ResumePicker';

function makeRow(id: string, overrides?: Record<string, unknown>) {
  return {
    id,
    channelId: id,
    provider: 'claude',
    command: 'claude',
    args: '[]',
    mode: 'interactive',
    role: 'chat',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function setup() {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  if (!summoner.claude().hasInitSegments) summoner.claude().prepareInit();
  const sessionStore = container.get<SessionStore>(TYPES.SessionStore);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SocketProvider socket={summoner.socket}>
        <SessionProvider>
          <ResumeProvider>{children}</ResumeProvider>
        </SessionProvider>
      </SocketProvider>
    );
  }
  return { container, summoner, sessionStore, Wrapper };
}

describe('ResumePicker', () => {
  it('mounts and emits session:list with cwd + excludeLive: true + limit 50', async () => {
    const { summoner, Wrapper } = setup();
    const emitSpy = vi.spyOn(summoner.socket, 'emit');

    render(
      <Wrapper>
        <ResumePicker cwd="/proj" onResume={() => {}} onCancel={() => {}} />
      </Wrapper>,
    );

    await waitFor(() => {
      const calls = emitSpy.mock.calls.filter((c) => c[0] === 'session:list');
      expect(calls.length).toBeGreaterThan(0);
      const payload = calls[0][1] as Record<string, unknown>;
      expect(payload).toMatchObject({ cwd: '/proj', limit: 50, excludeLive: true });
    });
  });

  it('renders a row per returned session', async () => {
    const { sessionStore, Wrapper } = setup();
    await sessionStore.upsert(makeRow('sess-1', { cwd: '/proj', title: 'Add dark mode' }));
    await sessionStore.upsert(makeRow('sess-2', { cwd: '/proj', title: 'Fix login bug' }));

    render(
      <Wrapper>
        <ResumePicker cwd="/proj" onResume={() => {}} onCancel={() => {}} />
      </Wrapper>,
    );

    await screen.findByText('Add dark mode');
    await screen.findByText('Fix login bug');
  });

  it('clicking a row calls useResume and forwards channelId via onResume', async () => {
    const { sessionStore, summoner, Wrapper } = setup();
    await sessionStore.upsert(makeRow('sess-click', { cwd: '/proj', title: 'click me' }));
    summoner.claude().prepareInit();
    const onResume = vi.fn();

    render(
      <Wrapper>
        <ResumePicker cwd="/proj" onResume={onResume} onCancel={() => {}} />
      </Wrapper>,
    );

    const row = await screen.findByText('click me');
    await userEvent.setup({ pointerEventsCheck: 0 }).click(row);

    await waitFor(() => {
      expect(onResume).toHaveBeenCalledTimes(1);
      const channelId = onResume.mock.calls[0][0];
      expect(typeof channelId).toBe('string');
      expect(channelId.length).toBeGreaterThan(0);
    });
  });

  it('shows project-scoped empty state when list is empty', async () => {
    const { Wrapper } = setup();
    const onCancel = vi.fn();
    render(
      <Wrapper>
        <ResumePicker cwd="/empty-proj" onResume={() => {}} onCancel={onCancel} />
      </Wrapper>,
    );

    await screen.findByText(/No resumable sessions for this project/i);
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('button', { name: /close/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows generic empty state when no cwd and list is empty', async () => {
    const { Wrapper } = setup();
    render(
      <Wrapper>
        <ResumePicker onResume={() => {}} onCancel={() => {}} />
      </Wrapper>,
    );

    await screen.findByText(/^No resumable sessions\.?$/i);
  });
});

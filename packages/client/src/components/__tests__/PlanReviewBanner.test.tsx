import type { PlanCommentData } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppInitProvider } from '../../contexts/AppInitContext';
import { ChannelProvider, useChannelMessages } from '../../contexts/channel';
import { PluginProvider } from '../../contexts/PluginContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { TabProvider } from '../../contexts/TabContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { PlanReviewBanner } from '../PlanReviewBanner';

/** Helper to add planComments from within the component tree */
function PlanCommentSetter({ comments }: { comments: PlanCommentData[] }) {
  const { addPlanComment } = useChannelMessages();
  React.useEffect(() => {
    for (const c of comments) addPlanComment(c);
  }, [comments, addPlanComment]);
  return null;
}

import React from 'react';

async function renderInChannel(ui: ReactElement, opts?: { planComments?: PlanCommentData[] }) {
  const summoner = createFakeSummoner();
  const channelId = crypto.randomUUID();
  const result = render(ui, {
    wrapper: ({ children }) => (
      <SocketProvider socket={summoner.socket}>
        <AppInitProvider>
          <SessionProvider>
            <PluginProvider>
              <TabProvider
                initialState={{
                  tabs: { [channelId]: { tabStatus: 'idle', launchOnMount: false } },
                  activeTabId: channelId,
                }}
              >
                <ChannelProvider channelId={channelId}>
                  {opts?.planComments && <PlanCommentSetter comments={opts.planComments} />}
                  {children}
                </ChannelProvider>
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </AppInitProvider>
      </SocketProvider>
    ),
  });
  await act(async () => {
    await summoner.claude().initialize(s.init('sess-1'), { launch: { channelId } });
  });
  return { summoner, channelId, ...result };
}

describe('PlanReviewBanner comment input', () => {
  it('renders a comment textarea', async () => {
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode' }}
        onRespond={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText(/add feedback/i)).toBeInTheDocument();
  });

  it('sends comment as deny message on Continue Planning', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode' }}
        onRespond={onRespond}
      />,
    );
    await user.type(screen.getByPlaceholderText(/add feedback/i), 'Please add tests');
    await user.click(screen.getByRole('button', { name: /continue planning/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'deny',
      message: 'Please add tests',
      interrupt: false,
    });
  });

  it('uses default message when comment is empty', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode' }}
        onRespond={onRespond}
      />,
    );
    await user.click(screen.getByRole('button', { name: /continue planning/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'deny',
      message: 'User chose to stay in plan mode and continue planning',
      interrupt: false,
    });
  });

  it('resets comment when requestId changes', async () => {
    const user = userEvent.setup();
    const { rerender } = await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode' }}
        onRespond={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText(/add feedback/i), 'some feedback');

    rerender(
      <PlanReviewBanner
        pending={{ requestId: 'r2', subtype: 'exit_plan_mode' }}
        onRespond={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText(/add feedback/i)).toHaveValue('');
  });

  it('renders plan markdown preview when input.plan is present', async () => {
    await renderInChannel(
      <PlanReviewBanner
        pending={{
          requestId: 'r1',
          subtype: 'exit_plan_mode',
          input: { plan: '# My Plan\n\nSome **bold** text' },
        }}
        onRespond={vi.fn()}
      />,
    );
    expect(screen.getByText('My Plan')).toBeInTheDocument();
    expect(screen.getByText(/bold/)).toBeInTheDocument();
  });

  it('does not affect Approve Plan behavior', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode', input: {} }}
        onRespond={onRespond}
      />,
    );
    await user.type(screen.getByPlaceholderText(/add feedback/i), 'some comment');
    await user.click(screen.getByRole('button', { name: /approve plan/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'allow',
      updatedInput: {},
    });
  });
});

describe('PlanReviewBanner approve with planComments', () => {
  it('includes userFeedback in onRespond when planComments exist', async () => {
    const comments: PlanCommentData[] = [
      { id: '1', selectedText: 'step 1', comment: 'needs more detail', sectionHeading: '' },
      { id: '2', selectedText: 'step 2', comment: 'looks good', sectionHeading: '' },
    ];
    const onRespond = vi.fn();
    const user = userEvent.setup();
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode', input: { plan: '# Plan' } }}
        onRespond={onRespond}
      />,
      { planComments: comments },
    );
    await user.click(screen.getByRole('button', { name: /approve plan/i }));
    expect(onRespond).toHaveBeenCalledWith({
      behavior: 'allow',
      updatedInput: { plan: '# Plan' },
      userFeedback: '[On "step 1"]: needs more detail\n[On "step 2"]: looks good',
    });
  });

  it('does NOT include userFeedback when no planComments exist', async () => {
    const onRespond = vi.fn();
    const user = userEvent.setup();
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode', input: {} }}
        onRespond={onRespond}
      />,
    );
    await user.click(screen.getByRole('button', { name: /approve plan/i }));
    const call = onRespond.mock.calls[0][0];
    expect(call.behavior).toBe('allow');
    expect(call.userFeedback).toBeUndefined();
  });

  it('clears planComments after approving', async () => {
    const comments: PlanCommentData[] = [
      { id: '1', selectedText: 'some text', comment: 'my comment', sectionHeading: '' },
    ];
    const onRespond = vi.fn();
    const user = userEvent.setup();
    await renderInChannel(
      <PlanReviewBanner
        pending={{ requestId: 'r1', subtype: 'exit_plan_mode', input: { plan: '# Plan' } }}
        onRespond={onRespond}
      />,
      { planComments: comments },
    );
    expect(screen.getByText(/1 comment/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /approve plan/i }));
    await waitFor(() => {
      expect(screen.queryByText(/comment/i)).not.toBeInTheDocument();
    });
  });
});

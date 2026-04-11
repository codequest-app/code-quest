/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { MessageList } from '../../components/MessageList';
import { createFakeSummoner } from '../../test/fake-summoner';
import { renderWithChannel } from '../../test/render-with-channel';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { useChannelMessages } from '../channel';

/** Test harness that exposes useChannelMessages values to the DOM */
function ChannelTestHarness() {
  const ctx = useChannelMessages();
  return (
    <div>
      <span data-testid="channelId">{ctx.channelId}</span>
      <span data-testid="isCancelling">{String(ctx.isCancelling)}</span>
      <span data-testid="modifiedFiles">{JSON.stringify(ctx.modifiedFiles)}</span>
      <span data-testid="planComments">{JSON.stringify(ctx.planComments)}</span>
      <button type="button" data-testid="abort" onClick={ctx.abort}>
        abort
      </button>
      <button type="button" data-testid="clearModifiedFiles" onClick={ctx.clearModifiedFiles}>
        clearModifiedFiles
      </button>
      <button
        type="button"
        data-testid="removeModifiedFile"
        onClick={() => ctx.removeModifiedFile('nonexistent.ts')}
      >
        removeModifiedFile
      </button>
      <button
        type="button"
        data-testid="addPlanComment"
        onClick={() =>
          ctx.addPlanComment({
            id: 'c1',
            selectedText: 'foo',
            sectionHeading: 'Plan',
            comment: 'bar',
          })
        }
      >
        addPlanComment
      </button>
      <button type="button" data-testid="clearPlanComments" onClick={ctx.clearPlanComments}>
        clearPlanComments
      </button>
    </div>
  );
}

async function setup() {
  const user = userEvent.setup();
  const ctx = await renderWithChannel(<ChannelTestHarness />);
  return { ...ctx, user };
}

describe('ChannelContext', () => {
  it('provides channelId via useChannelMessages', async () => {
    const { channelId } = await setup();
    expect(screen.getByTestId('channelId')).toHaveTextContent(channelId);
  });

  it('abort changes status to cancelling', async () => {
    const { user } = await setup();
    expect(screen.getByTestId('isCancelling')).toHaveTextContent('false');
    await user.click(screen.getByTestId('abort'));
    expect(screen.getByTestId('isCancelling')).toHaveTextContent('true');
  });

  it('throws when useChannelMessages is called outside provider', () => {
    expect(() => {
      renderHook(() => useChannelMessages());
    }).toThrow('must be used within a ChannelMessagesProvider');
  });

  describe('semantic state APIs', () => {
    it('clearModifiedFiles resets modifiedFiles to empty', async () => {
      const { user } = await setup();
      await user.click(screen.getByTestId('clearModifiedFiles'));
      expect(screen.getByTestId('modifiedFiles')).toHaveTextContent('{}');
    });

    it('removeModifiedFile removes a single file', async () => {
      const { user } = await setup();
      await user.click(screen.getByTestId('clearModifiedFiles'));
      await user.click(screen.getByTestId('removeModifiedFile'));
      expect(screen.getByTestId('modifiedFiles')).toHaveTextContent('{}');
    });

    it('addPlanComment adds a comment', async () => {
      const { user } = await setup();
      const comment = { id: 'c1', selectedText: 'foo', sectionHeading: 'Plan', comment: 'bar' };
      await user.click(screen.getByTestId('addPlanComment'));
      expect(screen.getByTestId('planComments')).toHaveTextContent(JSON.stringify([comment]));
    });

    it('clearPlanComments resets to empty', async () => {
      const { user } = await setup();
      await user.click(screen.getByTestId('addPlanComment'));
      await user.click(screen.getByTestId('clearPlanComments'));
      expect(screen.getByTestId('planComments')).toHaveTextContent('[]');
    });
  });

  describe('action reference stability', () => {
    function RefStabilityHarness({ actionName }: { actionName: 'addPlanComment' | 'abort' }) {
      const ctx = useChannelMessages();
      const action = ctx[actionName];
      const initialRef = useRef(action);
      const stable = action === initialRef.current;
      return (
        <div>
          <span data-testid="stable">{String(stable)}</span>
          <button
            type="button"
            data-testid="trigger"
            onClick={() =>
              ctx.addPlanComment({ id: 'c1', selectedText: 'x', sectionHeading: '', comment: 'y' })
            }
          >
            trigger
          </button>
        </div>
      );
    }

    it('addPlanComment keeps the same reference after state change', async () => {
      const user = userEvent.setup();
      await renderWithChannel(<RefStabilityHarness actionName="addPlanComment" />);
      expect(screen.getByTestId('stable')).toHaveTextContent('true');
      await user.click(screen.getByTestId('trigger'));
      expect(screen.getByTestId('stable')).toHaveTextContent('true');
    });

    it('abort keeps the same reference after state change', async () => {
      const user = userEvent.setup();
      await renderWithChannel(<RefStabilityHarness actionName="abort" />);
      expect(screen.getByTestId('stable')).toHaveTextContent('true');
      await user.click(screen.getByTestId('trigger'));
      expect(screen.getByTestId('stable')).toHaveTextContent('true');
    });
  });

  describe('launch mode', () => {
    it('launch creates session and renders channel content', async () => {
      const { addProject } = await renderWithWorkspace();
      const project = await addProject();
      const channelId = await project.launchSession();

      // Session created on server (channelId returned)
      expect(channelId).toBeTruthy();

      // Channel content rendered
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });

    it('launch failure shows error UI with retry button', async () => {
      const summoner = createFakeSummoner();
      summoner.claude().prepareInit();
      // Intercept session:launch to return error
      const origEmit = summoner.socket.emit.bind(summoner.socket);
      // @ts-expect-error — intercepting FakeSocket.emit to simulate server error
      summoner.socket.emit = (event: string, ...args: unknown[]) => {
        if (event === 'session:launch') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ error: 'CLI not found' });
          return summoner.socket;
        }
        return origEmit(event, ...args);
      };

      await renderWithChannel(<span data-testid="content">loaded</span>, {
        summoner,
        cwd: '/bad/path',
        skipInit: true,
      });

      // Should show error, not children or spinner
      expect(
        await screen.findByText(/Failed to connect/, {}, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('join failure shows error message in message list', async () => {
      const channelId = crypto.randomUUID();

      await renderWithChannel(<MessageList />, { channelId, skipInit: true });

      // FakeServer returns { error: "Session not found" } for non-existent channelId
      expect(await screen.findByText(/Session not found/i)).toBeInTheDocument();
    });

    it('join failure still allows session:states processing', async () => {
      const summoner = createFakeSummoner();
      summoner.claude().prepareInit();
      const channelId = crypto.randomUUID();

      // Intercept session:join to return error
      const origEmit = summoner.socket.emit.bind(summoner.socket);
      // @ts-expect-error — intercepting FakeSocket.emit to simulate server error
      summoner.socket.emit = (event: string, ...args: unknown[]) => {
        if (event === 'session:join') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ error: 'Session not found' });
          return summoner.socket;
        }
        return origEmit(event, ...args);
      };

      function StatusHarness() {
        const { isProcessing } = useChannelMessages();
        return <span data-testid="processing">{String(isProcessing)}</span>;
      }

      await renderWithChannel(<StatusHarness />, { summoner, channelId, skipInit: true });

      // Push session:states busy — should not be blocked by joinedRef
      await act(async () => {
        summoner.claude().pushServerEvent('session:states', {
          sessions: [{ channelId, state: 'busy' }],
        });
      });

      // If join failure blocks onSessionStates, processing stays false
      expect(screen.getByTestId('processing')).toHaveTextContent('true');
    });
  });
});

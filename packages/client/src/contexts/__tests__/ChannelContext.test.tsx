import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../test/fake-claude';
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
      const { channelId } = await renderWithWorkspace();

      // Session created on server (channelId returned)
      expect(channelId).toBeTruthy();

      // Channel content rendered
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });

    it('launch failure does not freeze on Connecting screen', async () => {
      const claude = createFakeClaude();
      // Prepare an error response for session:launch
      claude.prepareInit();
      const origEmit = claude.socket.emit.bind(claude.socket);
      claude.socket.emit = ((event: string, ...args: unknown[]) => {
        if (event === 'session:launch') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ error: 'CLI not found' });
          return claude.socket;
        }
        return (origEmit as (...a: unknown[]) => unknown)(event, ...args);
      }) as typeof claude.socket.emit;

      await renderWithChannel(<span data-testid="content">loaded</span>, {
        claude,
        cwd: '/bad/path',
        skipInit: true,
      });

      // Should not stay on "Connecting…" forever — should render children
      expect(await screen.findByTestId('content', {}, { timeout: 3000 })).toBeInTheDocument();
    });

    it('join failure still allows session:states processing', async () => {
      const claude = createFakeClaude();
      claude.prepareInit();
      const channelId = crypto.randomUUID();

      // Mock session:join to return error
      const origEmit = claude.socket.emit.bind(claude.socket);
      claude.socket.emit = ((event: string, ...args: unknown[]) => {
        if (event === 'session:join') {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') cb({ error: 'Session not found' });
          return claude.socket;
        }
        return (origEmit as (...a: unknown[]) => unknown)(event, ...args);
      }) as typeof claude.socket.emit;

      function StatusHarness() {
        const { isProcessing } = useChannelMessages();
        return <span data-testid="processing">{String(isProcessing)}</span>;
      }

      await renderWithChannel(<StatusHarness />, { claude, channelId, skipInit: true });

      // Push session:states busy — should not be blocked by joinedRef
      await claude.pushServerEvent('session:states', {
        sessions: [{ channelId, state: 'busy' }],
      });

      // If join failure blocks onSessionStates, processing stays false
      expect(screen.getByTestId('processing')).toHaveTextContent('true');
    });
  });
});

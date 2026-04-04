import { segments as s } from '@code-quest/summoner/test';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../test/fake-claude';
import { ChannelProvider, useChannelMessages, useCwd } from '../channel';
import { PluginProvider } from '../PluginContext';
import { SessionProvider } from '../SessionContext';
import { SocketProvider } from '../SocketContext';
import { TabProvider } from '../TabContext';

function wrapper(channelId: string, claude = createFakeClaude(), cwd = '/test/workspace') {
  return ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId} cwd={cwd}>
              {children}
            </ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>
  );
}

describe('ChannelContext', () => {
  it('provides channelId via useChannelMessages', async () => {
    const claude = createFakeClaude();
    const channelId = await claude.initialize(s.init('sess-1'));
    const { result } = renderHook(() => useChannelMessages(), {
      wrapper: wrapper(channelId, claude),
    });
    expect(result.current.channelId).toBe(channelId);
  });

  it('abort changes status to cancelling', async () => {
    const claude = createFakeClaude();
    const channelId = await claude.initialize(s.init('sess-1'));
    const { result } = renderHook(() => useChannelMessages(), {
      wrapper: wrapper(channelId, claude),
    });

    expect(result.current.isCancelling).toBe(false);
    act(() => result.current.abort());
    expect(result.current.isCancelling).toBe(true);
  });

  it('throws when useChannelMessages is called outside provider', () => {
    expect(() => {
      renderHook(() => useChannelMessages());
    }).toThrow('must be used within a ChannelMessagesProvider');
  });

  describe('semantic state APIs', () => {
    it('clearModifiedFiles resets modifiedFiles to empty', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useChannelMessages(), {
        wrapper: wrapper(channelId, claude),
      });
      act(() => result.current.clearModifiedFiles());
      expect(result.current.modifiedFiles).toEqual({});
    });

    it('removeModifiedFile removes a single file', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useChannelMessages(), {
        wrapper: wrapper(channelId, claude),
      });
      act(() => result.current.clearModifiedFiles());
      act(() => result.current.removeModifiedFile('nonexistent.ts'));
      expect(result.current.modifiedFiles).toEqual({});
    });

    it('addPlanComment adds a comment', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useChannelMessages(), {
        wrapper: wrapper(channelId, claude),
      });
      const comment = { id: 'c1', selectedText: 'foo', sectionHeading: 'Plan', comment: 'bar' };
      act(() => result.current.addPlanComment(comment));
      expect(result.current.planComments).toEqual([comment]);
    });

    it('clearPlanComments resets to empty', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useChannelMessages(), {
        wrapper: wrapper(channelId, claude),
      });
      act(() =>
        result.current.addPlanComment({
          id: 'c1',
          selectedText: 'foo',
          sectionHeading: 'Plan',
          comment: 'bar',
        }),
      );
      act(() => result.current.clearPlanComments());
      expect(result.current.planComments).toEqual([]);
    });
  });

  describe('action reference stability', () => {
    it('addPlanComment keeps the same reference after state change', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useChannelMessages(), {
        wrapper: wrapper(channelId, claude),
      });
      const ref1 = result.current.addPlanComment;
      act(() =>
        result.current.addPlanComment({
          id: 'c1',
          selectedText: 'x',
          sectionHeading: '',
          comment: 'y',
        }),
      );
      expect(result.current.addPlanComment).toBe(ref1);
    });

    it('abort keeps the same reference after state change', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useChannelMessages(), {
        wrapper: wrapper(channelId, claude),
      });
      const ref1 = result.current.abort;
      act(() =>
        result.current.addPlanComment({
          id: 'c1',
          selectedText: 'x',
          sectionHeading: '',
          comment: 'y',
        }),
      );
      expect(result.current.abort).toBe(ref1);
    });
  });

  describe('cwd', () => {
    it('provides cwd via useCwd', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useCwd(), {
        wrapper: wrapper(channelId, claude, '/my/project'),
      });
      expect(result.current).toBe('/my/project');
    });

    it('defaults to ../ when not specified', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('sess-1'));
      const { result } = renderHook(() => useCwd(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <SocketProvider socket={claude.socket}>
            <SessionProvider>
              <PluginProvider>
                <TabProvider>
                  <ChannelProvider channelId={channelId}>{children}</ChannelProvider>
                </TabProvider>
              </PluginProvider>
            </SessionProvider>
          </SocketProvider>
        ),
      });
      expect(result.current).toBe('../');
    });
  });
});

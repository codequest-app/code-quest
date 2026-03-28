/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeClaude } from '../../../test/fake-claude';
import { ChannelProvider, useChannelConfig } from '../../channel';
import { PluginProvider } from '../../PluginContext';
import { SessionProvider } from '../../SessionContext';
import { SocketProvider } from '../../SocketContext';
import { TabProvider } from '../../TabContext';

function wrapper(channelId: string, socket = createFakeClaude().socket) {
  return ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId={channelId}>{children}</ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>
  );
}

describe('ChannelConfigContext', () => {
  it('updates config from state:update event', async () => {
    const claude = createFakeClaude();
    const { result } = renderHook(() => useChannelConfig(), {
      wrapper: wrapper('ch-1', claude.socket),
    });

    expect(result.current.model).toBeNull();

    // Server emits state:update with per-channel config
    await act(async () => {
      (claude.socket as any).serverSocket.emit('state:update', {
        channelId: 'ch-1',
        mcpServers: [{ name: 'github', status: 'connected' }],
      });
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.mcpServers).toEqual([{ name: 'github', status: 'connected' }]);
  });

  it('updates config from session:init event', async () => {
    const claude = createFakeClaude();
    const { result } = renderHook(() => useChannelConfig(), {
      wrapper: wrapper('ch-1', claude.socket),
    });

    expect(result.current.model).toBeNull();

    await act(async () => {
      (claude.socket as any).serverSocket.emit('session:init', {
        channelId: 'ch-1',
        sessionId: 'sess-1',
        model: 'claude-sonnet-4-6',
        tools: ['Read', 'Write'],
        permissionMode: 'default',
        fastModeState: 'off',
        slashCommands: ['commit', 'review'],
        mcpServers: [{ name: 'github', status: 'connected' }],
        config: {},
      });
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.model).toBe('claude-sonnet-4-6');
    expect(result.current.tools).toEqual(['Read', 'Write']);
    expect(result.current.permissionMode).toBe('default');
    expect(result.current.isFastMode).toBe(false);
    expect(result.current.slashCommands).toContain('commit');
    expect(result.current.slashCommands).toContain('review');
    expect(result.current.mcpServers).toEqual([{ name: 'github', status: 'connected' }]);
  });

  it('thinkingLevel updates from state:update event (server emit after set_thinking_level)', async () => {
    const claude = createFakeClaude();
    const { result } = renderHook(() => useChannelConfig(), {
      wrapper: wrapper('ch-1', claude.socket),
    });

    expect(result.current.thinkingLevel).toBe('off');

    await act(async () => {
      (claude.socket as any).serverSocket.emit('state:update', {
        channelId: 'ch-1',
        thinkingLevel: 'default_on',
      });
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.thinkingLevel).toBe('default_on');
  });
});

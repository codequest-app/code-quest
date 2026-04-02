import { segments as s } from '@code-quest/summoner/test';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeClaude } from '../../test/fake-claude';
import { ChannelProvider } from '../channel';
import { useGit } from '../GitContext';
import { PluginProvider } from '../PluginContext';
import { SessionProvider } from '../SessionContext';
import { SocketProvider } from '../SocketContext';
import { TabProvider } from '../TabContext';

function setup(workspaceFolder = '/my/project') {
  const claude = createFakeClaude();
  // biome-ignore lint/suspicious/noExplicitAny: spy on socket.emit for client → server verification
  const emitSpy = vi.spyOn(claude.socket as any, 'emit');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <ChannelProvider channelId="test-ch" workspaceFolder={workspaceFolder}>
              {children}
            </ChannelProvider>
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>
  );
  return { claude, emitSpy, wrapper };
}

describe('GitContext', () => {
  it('git:status sends cwd from workspaceFolder', async () => {
    const { claude, emitSpy, wrapper } = setup('/my/project');
    await claude.initialize(s.init('sess-1'));
    const { result } = renderHook(() => useGit(), { wrapper });

    result.current.gitStatus();

    expect(emitSpy).toHaveBeenCalledWith(
      'git:status',
      expect.objectContaining({ cwd: '/my/project' }),
      expect.any(Function),
    );
  });

  it('git:checkout sends branch + cwd', async () => {
    const { claude, emitSpy, wrapper } = setup('/workspace');
    await claude.initialize(s.init('sess-1'));
    const { result } = renderHook(() => useGit(), { wrapper });

    result.current.gitCheckout('feature-x');

    expect(emitSpy).toHaveBeenCalledWith(
      'git:checkout',
      expect.objectContaining({ branch: 'feature-x', cwd: '/workspace' }),
      expect.any(Function),
    );
  });
});

import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../../test/fake-summoner';
import { SocketProvider } from '../../SocketContext';
import { TabProvider, useTabActions, useTabState } from '../../TabContext';

function setup() {
  const summoner = createFakeSummoner();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={summoner.socket}>
      <TabProvider>{children}</TabProvider>
    </SocketProvider>
  );
  return renderHook(
    () => {
      const state = useTabState();
      const actions = useTabActions();
      return { state, actions };
    },
    { wrapper },
  );
}

describe('TabContext split', () => {
  it('splitTabId is null by default', () => {
    const { result } = setup();
    expect(result.current.state.splitTabId).toBeNull();
  });

  it('enterSplit sets splitTabId', () => {
    const { result } = setup();
    act(() => result.current.actions.addTab('a'));
    act(() => result.current.actions.addTab('b'));
    act(() => result.current.actions.enterSplit('b'));
    expect(result.current.state.splitTabId).toBe('b');
  });

  it('exitSplit clears splitTabId', () => {
    const { result } = setup();
    act(() => result.current.actions.addTab('a'));
    act(() => result.current.actions.addTab('b'));
    act(() => result.current.actions.enterSplit('b'));
    act(() => result.current.actions.exitSplit());
    expect(result.current.state.splitTabId).toBeNull();
  });

  it('removing the split tab clears splitTabId', () => {
    const { result } = setup();
    act(() => result.current.actions.addTab('a'));
    act(() => result.current.actions.addTab('b'));
    act(() => result.current.actions.enterSplit('b'));
    act(() => result.current.actions.removeTab('b'));
    expect(result.current.state.splitTabId).toBeNull();
  });

  it('removing the active tab promotes splitTabId to active', () => {
    const { result } = setup();
    act(() => result.current.actions.addTab('a'));
    act(() => result.current.actions.addTab('b'));
    act(() => result.current.actions.setActiveTab('a'));
    act(() => result.current.actions.enterSplit('b'));
    act(() => result.current.actions.removeTab('a'));
    expect(result.current.state.activeTabId).toBe('b');
    expect(result.current.state.splitTabId).toBeNull();
  });

  it('enterSplit with the active tab is a no-op', () => {
    const { result } = setup();
    act(() => result.current.actions.addTab('a'));
    act(() => result.current.actions.setActiveTab('a'));
    act(() => result.current.actions.enterSplit('a'));
    expect(result.current.state.splitTabId).toBeNull();
  });
});

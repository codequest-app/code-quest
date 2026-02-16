import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../../stores/battleStore';
import { useChatStore } from '../../stores/chatStore';
import { useBattleEngine } from '../useBattleEngine';

describe('useBattleEngine', () => {
  beforeEach(() => {
    useChatStore.setState({ chatSessions: new Map() });
    useBattleStore.setState({
      battles: new Map(),
      prompts: new Map(),
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
  });

  it('starts battle when user sends a message', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the login bug');
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle).toBeDefined();
    expect(battle?.phase).toBe('active');
    expect(battle?.enemy.type).toBe('bug-hunt');
    expect(battle?.log.length).toBeGreaterThan(0);
  });

  it('processes tool_use events as skill casts + damage', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the login bug');
    });

    const enemyHpBefore = useBattleStore.getState().getBattle('s1')?.enemy.hp;

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't1', name: 'Read', input: {} },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.enemy.hp).toBeLessThan(enemyHpBefore ?? 0);
    expect(battle?.log.some((l) => l.type === 'skill')).toBe(true);
    expect(battle?.log.some((l) => l.type === 'damage')).toBe(true);
  });

  it('triggers victory when processing completes', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the login bug');
    });

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'text',
        data: { content: 'Done!' },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: { durationMs: 1000 } },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.phase).toBe('victory');
    expect(battle?.goldEarned).toBeGreaterThan(0);
    expect(battle?.expEarned).toBeGreaterThan(0);
  });

  it('increments combo count on consecutive tool uses', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix bug');
    });

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't1', name: 'Read', input: {} },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't2', name: 'Edit', input: {} },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.comboCount).toBeGreaterThanOrEqual(2);
  });

  it('persists player exp across battles', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix bug');
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'text',
        data: { content: 'Done!' },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    const player = useBattleStore.getState().player;
    expect(player.totalExp).toBeGreaterThan(0);
    expect(player.totalGold).toBeGreaterThan(0);
  });

  it('tracks multiple sessions simultaneously', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    useChatStore.getState().initChatSession('s2', 'gemini');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix bug');
    });
    act(() => {
      useChatStore.getState().addUserMessage('s2', 'add feature');
    });

    expect(useBattleStore.getState().getBattle('s1')).toBeDefined();
    expect(useBattleStore.getState().getBattle('s2')).toBeDefined();
    expect(useBattleStore.getState().getBattle('s1')?.enemy.type).toBe('bug-hunt');
    expect(useBattleStore.getState().getBattle('s2')?.enemy.type).toBe('code-task');
  });

  it('triggers enemy counter on denied tool permission', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix bug');
    });

    // Simulate tool_use followed by result with pendingPermission (denied)
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't1', name: 'Bash', input: { command: 'rm -rf /' } },
      });
    });

    const hpBefore = useBattleStore.getState().getBattle('s1')?.playerHp;

    // Result with unresolved tool_use → pendingPermission
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    // Should have enemy counter (playerHp reduced) since Bash was denied
    expect(battle?.playerHp).toBeLessThan(hpBefore ?? 100);
    expect(battle?.log.some((l) => l.type === 'error')).toBe(true);
  });
});

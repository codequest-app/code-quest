import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBankStore } from '../../stores/bankStore';
import { useBattleStore } from '../../stores/battleStore';
import { useChatStore } from '../../stores/chatStore';
import { useBattleEngine } from '../useBattleEngine';

describe('useBattleEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    useChatStore.setState({ chatSessions: new Map() });
    useBattleStore.setState({
      battles: new Map(),
      prompts: new Map(),
      player: { level: 1, totalExp: 0, totalGold: 0 },
      activeBattleId: undefined,
    });
    useBankStore.setState({
      sessionCosts: new Map(),
      totalCost: 0,
      budget: undefined,
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

  it('detects thinking state and triggers stasis_enter', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'thinking',
        data: { content: 'x'.repeat(200) },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.isPaused).toBe(true);
    expect(battle?.pauseReason).toBe('plan_mode');
  });

  it('detects pending question and triggers npc_dialogue', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    // Simulate AskUserQuestion tool_use which sets pendingQuestion
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: {
          id: 'q1',
          name: 'AskUserQuestion',
          input: {
            questions: [
              {
                question: 'Which?',
                header: 'Q',
                options: [{ label: 'A' }, { label: 'B' }],
                multiSelect: false,
              },
            ],
          },
        },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    // The pending question should be detected
    expect(battle?.isPaused).toBe(true);
    expect(battle?.pauseReason).toBe('question');
  });

  it('resumes battle when question is answered', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: {
          id: 'q1',
          name: 'AskUserQuestion',
          input: {
            questions: [
              {
                question: 'Which?',
                header: 'Q',
                options: [{ label: 'A' }, { label: 'B' }],
                multiSelect: false,
              },
            ],
          },
        },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    // Now clear the pending question (simulating user answered)
    act(() => {
      useChatStore.getState().clearPendingQuestion('s1');
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.isPaused).toBe(false);
  });

  it('detects pending permission and triggers trap_detected', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    // Simulate tool_use followed by result (unresolved tool_use → pendingPermission)
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't1', name: 'Bash', input: { command: 'ls' } },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.isPaused).toBe(true);
    expect(battle?.pauseReason).toBe('permission');
    expect(battle?.activeTrap?.toolName).toBe('Bash');
  });

  it('resumes battle when permission is resolved', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't1', name: 'Bash', input: { command: 'ls' } },
      });
    });
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    act(() => {
      useChatStore.getState().clearPendingPermission('s1');
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.isPaused).toBe(false);
  });

  it('resets thinking tracking on tool_use', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'thinking',
        data: { content: 'x'.repeat(200) },
      });
    });

    expect(useBattleStore.getState().getBattle('s1')?.isPaused).toBe(true);

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'tool_use',
        data: { id: 't1', name: 'Read', input: {} },
      });
    });

    // stasis_exit from tool_use + skill cast
    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.isPaused).toBe(false);
  });

  it('pauses battle as trap when denied tool permission', () => {
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

    // Result with unresolved tool_use → pendingPermission → trap_detected
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: {} },
      });
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.isPaused).toBe(true);
    expect(battle?.pauseReason).toBe('permission');
    expect(battle?.activeTrap?.toolName).toBe('Bash');
  });

  it('sets modelId from session provider on battle start', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix the bug');
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.modelId).toBe('sonnet');
  });

  it('records cost in bankStore on victory with costUsd', () => {
    useChatStore.getState().initChatSession('s1', 'claude');
    renderHook(() => useBattleEngine());

    act(() => {
      useChatStore.getState().addUserMessage('s1', 'fix bug');
    });

    // Simulate a text event followed by result with costUsd in stats
    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'text',
        data: { content: 'Done!' },
      });
    });

    // Manually inject stats on the assistant message
    const session = useChatStore.getState().chatSessions.get('s1');
    if (session) {
      const msgs = [...session.messages];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...lastMsg, stats: { costUsd: 0.05 } };
        const chatSessions = new Map(useChatStore.getState().chatSessions);
        chatSessions.set('s1', { ...session, messages: msgs });
        useChatStore.setState({ chatSessions });
      }
    }

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: { costUsd: 0.05 } },
      });
    });

    expect(useBankStore.getState().totalCost).toBeGreaterThan(0);
  });

  it('records cost from token counts when costUsd is absent', () => {
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

    // Inject stats with tokens but no costUsd
    const session = useChatStore.getState().chatSessions.get('s1');
    if (session) {
      const msgs = [...session.messages];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant') {
        msgs[msgs.length - 1] = {
          ...lastMsg,
          stats: { inputTokens: 1000, outputTokens: 500 },
        };
        const chatSessions = new Map(useChatStore.getState().chatSessions);
        chatSessions.set('s1', { ...session, messages: msgs });
        useChatStore.setState({ chatSessions });
      }
    }

    act(() => {
      useChatStore.getState().handleChatEvent('s1', {
        type: 'result',
        data: { stats: { inputTokens: 1000, outputTokens: 500 } },
      });
    });

    expect(useBankStore.getState().totalCost).toBeGreaterThan(0);
  });
});

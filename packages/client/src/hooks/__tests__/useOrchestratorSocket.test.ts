import type { ChatStreamEvent, WorkerInfo } from '@code-quest/shared';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../stores/chatStore';
import { useOrchestratorStore } from '../../stores/orchestratorStore';
import { useOrchestratorSocket } from '../useOrchestratorSocket';

// Mock useSocket to capture socket event handlers
const listeners = new Map<string, (...args: unknown[]) => void>();
const mockSocket = {
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    listeners.set(event, handler);
  }),
  off: vi.fn(),
  emit: vi.fn(),
};

vi.mock('../useSocket', () => ({
  useSocket: () => ({
    socket: mockSocket,
    emit: mockSocket.emit,
  }),
}));

function makeWorker(id: string, description: string): WorkerInfo {
  return {
    id,
    task: { description, provider: 'claude' },
    status: 'pending',
  };
}

describe('useOrchestratorSocket – chatStore wiring', () => {
  beforeEach(() => {
    listeners.clear();
    mockSocket.on.mockClear();
    useChatStore.setState({ chatSessions: new Map() });
    useOrchestratorStore.getState().initOrchestrator('orch-1', 'coord-1', 'claude');
  });

  function setup() {
    renderHook(() => useOrchestratorSocket('http://localhost'));
  }

  it('initializes chatStore sessions on dispatch', () => {
    setup();
    const workers = [makeWorker('w1', 'fix bug'), makeWorker('w2', 'add feature')];

    act(() => {
      listeners.get('orchestrator:dispatched')?.('orch-1', workers);
    });

    const chat = useChatStore.getState();
    expect(chat.getChatSession('w1')).toBeDefined();
    expect(chat.getChatSession('w2')).toBeDefined();
    // User message should be present (triggers battle start)
    expect(chat.getChatSession('w1')?.messages).toHaveLength(1);
    expect(chat.getChatSession('w1')?.messages[0].content).toBe('fix bug');
  });

  it('forwards worker events to chatStore', () => {
    setup();
    const workers = [makeWorker('w1', 'fix bug')];

    act(() => {
      listeners.get('orchestrator:dispatched')?.('orch-1', workers);
    });

    const textEvent: ChatStreamEvent = { type: 'text', data: { content: 'hello' } };
    act(() => {
      listeners.get('orchestrator:worker-event')?.('orch-1', 'w1', textEvent);
    });

    const session = useChatStore.getState().getChatSession('w1');
    const assistantMsg = session?.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg?.content).toBe('hello');
  });

  it('cleans up chatStore sessions on kill', () => {
    setup();
    const workers = [makeWorker('w1', 'fix bug')];
    useOrchestratorStore.getState().setWorkers('orch-1', workers);

    // Init chat session for the worker
    useChatStore.getState().initChatSession('w1', 'claude');
    expect(useChatStore.getState().getChatSession('w1')).toBeDefined();

    act(() => {
      listeners.get('orchestrator:dispatched')?.('orch-1', workers);
    });

    // Simulate kill via the returned function
    const { result } = renderHook(() => useOrchestratorSocket('http://localhost'));
    act(() => {
      result.current.killOrchestrator('orch-1');
    });

    expect(useChatStore.getState().getChatSession('w1')).toBeUndefined();
  });
});

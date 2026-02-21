import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { useChatStore } from '../../stores/chatStore';
import { useTerminalStore } from '../../stores/terminalStore';
import { useChatSocket } from '../useChatSocket';

// Spy on toast methods instead of mocking the entire module
let toastSuccessSpy: MockInstance;
let toastErrorSpy: MockInstance;

// Fake socket — has working listener registry (Fake), records calls (Spy)
const listeners: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
const mockEmit = vi.fn();
const fakeSocket = {
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    listeners.push({ event, handler });
  }),
  off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    const idx = listeners.findIndex((l) => l.event === event && l.handler === handler);
    if (idx !== -1) listeners.splice(idx, 1);
  }),
};

vi.mock('../useSocket', () => ({
  useSocket: () => ({
    socket: fakeSocket,
    emit: mockEmit,
  }),
}));

function fireSocketEvent(event: string, ...args: unknown[]) {
  for (const l of listeners) {
    if (l.event === event) {
      l.handler(...args);
    }
  }
}

describe('useChatSocket', () => {
  beforeEach(() => {
    listeners.length = 0;
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
    mockEmit.mockClear();
    toastSuccessSpy = vi.spyOn(toast, 'success').mockImplementation((() => '') as never);
    toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation((() => '') as never);
    useChatStore.setState({ chatSessions: new Map() });
    for (const s of useTerminalStore.getState().getSessions()) {
      useTerminalStore.getState().removeSession(s.id);
    }
  });

  it('should auto-emit chat:control initialize on chat:created', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    act(() => {
      fireSocketEvent('chat:created', 'session-1', 'claude');
    });

    expect(mockEmit).toHaveBeenCalledWith('chat:control', 'session-1', 'initialize', undefined);
  });

  it('should auto-emit mcp_status after chat:created', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    act(() => {
      fireSocketEvent('chat:created', 'session-1', 'claude');
    });

    expect(mockEmit).toHaveBeenCalledWith('chat:control', 'session-1', 'mcp_status', undefined);
  });

  it('should toast.success on successful control response', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));
    useChatStore.getState().initChatSession('session-1', 'claude');

    act(() => {
      fireSocketEvent('chat:control-response', 'session-1', {
        requestId: 'initialize-001',
        success: true,
        response: { pid: 123 },
      });
    });

    expect(toastSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('initialize'));
  });

  it('should toast.error on failed control response', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));
    useChatStore.getState().initChatSession('session-1', 'claude');

    act(() => {
      fireSocketEvent('chat:control-response', 'session-1', {
        requestId: 'set_model-002',
        success: false,
        error: 'Model not found',
      });
    });

    expect(toastErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Model not found'));
  });

  it('should remove session from chatStore and terminalStore on chat:exit', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    act(() => {
      fireSocketEvent('chat:created', 'session-1', 'claude');
    });

    expect(useChatStore.getState().getChatSession('session-1')).toBeDefined();
    expect(useTerminalStore.getState().getSession('session-1')).toBeDefined();

    act(() => {
      fireSocketEvent('chat:exit', 'session-1');
    });

    expect(useChatStore.getState().getChatSession('session-1')).toBeUndefined();
    expect(useTerminalStore.getState().getSession('session-1')).toBeUndefined();
  });

  it('should toast info on chat:exit', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    act(() => {
      fireSocketEvent('chat:created', 'session-1', 'claude');
    });

    act(() => {
      fireSocketEvent('chat:exit', 'session-1');
    });

    expect(toastSuccessSpy).toHaveBeenCalledWith(expect.stringContaining('exited'));
  });

  it('should not register system:capabilities listener (handled by useOrchestratorSocket)', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    const hasCapabilitiesListener = listeners.some((l) => l.event === 'system:capabilities');
    expect(hasCapabilitiesListener).toBe(false);
  });

  it('should write sent control to controlEventLog', () => {
    const { result } = renderHook(() => useChatSocket('http://localhost:3000'));
    useChatStore.getState().initChatSession('session-1', 'claude');

    act(() => {
      result.current.sendControl('session-1', 'set_model', { model: 'opus' });
    });

    const session = useChatStore.getState().getChatSession('session-1');
    const sentLog = session?.controlEventLog?.find(
      (e) => e.direction === 'sent' && e.type === 'set_model',
    );
    expect(sentLog).toBeDefined();
    expect(sentLog?.payload).toEqual({ model: 'opus' });
  });
});

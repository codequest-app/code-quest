import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../stores/chatStore';
import { useChatSocket } from '../useChatSocket';

// Mock useSocket — store all listeners (multiple handlers per event)
const listeners: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
const mockEmit = vi.fn();
const mockSocket = {
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    listeners.push({ event, handler });
  }),
  off: vi.fn(),
};

vi.mock('../useSocket', () => ({
  useSocket: () => ({
    socket: mockSocket,
    emit: mockEmit,
  }),
}));

function fireEvent(event: string, ...args: unknown[]) {
  for (const l of listeners) {
    if (l.event === event) {
      l.handler(...args);
    }
  }
}

describe('useChatSocket', () => {
  beforeEach(() => {
    listeners.length = 0;
    mockSocket.on.mockClear();
    mockEmit.mockClear();
    useChatStore.setState({ chatSessions: new Map() });
  });

  it('should auto-emit chat:control initialize on chat:created', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    act(() => {
      fireEvent('chat:created', 'session-1', 'claude');
    });

    // Should auto-emit chat:control with 'initialize'
    expect(mockEmit).toHaveBeenCalledWith('chat:control', 'session-1', 'initialize', undefined);
  });

  it('should auto-emit mcp_status after chat:created', () => {
    renderHook(() => useChatSocket('http://localhost:3000'));

    act(() => {
      fireEvent('chat:created', 'session-1', 'claude');
    });

    expect(mockEmit).toHaveBeenCalledWith('chat:control', 'session-1', 'mcp_status', undefined);
  });
});

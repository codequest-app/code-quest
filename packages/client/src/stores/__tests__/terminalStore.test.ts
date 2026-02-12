import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTerminalStore } from '../terminalStore';

describe('useTerminalStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useTerminalStore());
    act(() => {
      result.current.sessions.forEach((session) => {
        result.current.removeSession(session.id);
      });
      result.current.setActiveSession(null);
      result.current.setSocketConnected(false);
      result.current.setSocketError(null);
    });
  });

  describe('initial state', () => {
    it('should have empty sessions', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(result.current.sessions.size).toBe(0);
      expect(result.current.getSessions()).toEqual([]);
    });

    it('should have no active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(result.current.activeSessionId).toBeNull();
      expect(result.current.getActiveSession()).toBeUndefined();
    });

    it('should be disconnected', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(result.current.socketState.connected).toBe(false);
      expect(result.current.socketState.error).toBeNull();
    });
  });

  describe('addSession', () => {
    it('should add a new session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      expect(result.current.sessions.size).toBe(1);
      expect(result.current.getSession('session-1')).toMatchObject({
        id: 'session-1',
        pid: 1234,
        isActive: true, // First session is automatically active
      });
    });

    it('should add multiple sessions', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
        result.current.addSession('session-3', 9012);
      });

      expect(result.current.sessions.size).toBe(3);
      expect(result.current.getSessions()).toHaveLength(3);
    });

    it('should set first session as active by default', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      expect(result.current.activeSessionId).toBe('session-1');
      expect(result.current.getSession('session-1')?.isActive).toBe(true);
    });

    it('should not change active session when adding more sessions', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
      });

      expect(result.current.activeSessionId).toBe('session-1');
      expect(result.current.getSession('session-1')?.isActive).toBe(true);
      expect(result.current.getSession('session-2')?.isActive).toBe(false);
    });

    it('should include createdAt timestamp', () => {
      const { result } = renderHook(() => useTerminalStore());
      const now = Date.now();

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      const session = result.current.getSession('session-1');
      expect(session?.createdAt).toBeGreaterThanOrEqual(now);
      expect(session?.createdAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('removeSession', () => {
    it('should remove a session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.removeSession('session-1');
      });

      expect(result.current.sessions.size).toBe(0);
      expect(result.current.getSession('session-1')).toBeUndefined();
    });

    it('should remove specific session among multiple', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
        result.current.addSession('session-3', 9012);
        result.current.removeSession('session-2');
      });

      expect(result.current.sessions.size).toBe(2);
      expect(result.current.getSession('session-1')).toBeDefined();
      expect(result.current.getSession('session-2')).toBeUndefined();
      expect(result.current.getSession('session-3')).toBeDefined();
    });

    it('should switch active session when removing active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
        result.current.removeSession('session-1');
      });

      expect(result.current.activeSessionId).toBe('session-2');
      expect(result.current.getSession('session-2')?.isActive).toBe(true);
    });

    it('should clear active session when removing last session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.removeSession('session-1');
      });

      expect(result.current.activeSessionId).toBeNull();
      expect(result.current.getActiveSession()).toBeUndefined();
    });

    it('should handle removing non-existent session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      expect(() => {
        act(() => {
          result.current.removeSession('non-existent');
        });
      }).not.toThrow();

      expect(result.current.sessions.size).toBe(1);
    });
  });

  describe('setActiveSession', () => {
    it('should set active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
        result.current.setActiveSession('session-2');
      });

      expect(result.current.activeSessionId).toBe('session-2');
      expect(result.current.getSession('session-1')?.isActive).toBe(false);
      expect(result.current.getSession('session-2')?.isActive).toBe(true);
    });

    it('should update isActive flag on sessions', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
        result.current.addSession('session-3', 9012);
        result.current.setActiveSession('session-2');
      });

      const sessions = result.current.getSessions();
      const activeCount = sessions.filter((s) => s.isActive).length;
      expect(activeCount).toBe(1);
      expect(sessions.find((s) => s.id === 'session-2')?.isActive).toBe(true);
    });

    it('should handle setting null active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.setActiveSession(null);
      });

      expect(result.current.activeSessionId).toBeNull();
      expect(result.current.getSession('session-1')?.isActive).toBe(false);
    });
  });

  describe('socket state', () => {
    it('should set socket connected state', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.setSocketConnected(true);
      });

      expect(result.current.socketState.connected).toBe(true);
    });

    it('should set socket error', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.setSocketError('Connection failed');
      });

      expect(result.current.socketState.error).toBe('Connection failed');
    });

    it('should clear error when connecting', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.setSocketError('Connection failed');
        result.current.setSocketConnected(true);
      });

      expect(result.current.socketState.connected).toBe(true);
      expect(result.current.socketState.error).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return session by id', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      const session = result.current.getSession('session-1');
      expect(session).toMatchObject({
        id: 'session-1',
        pid: 1234,
      });
    });

    it('should return undefined for non-existent session', () => {
      const { result } = renderHook(() => useTerminalStore());

      const session = result.current.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getActiveSession', () => {
    it('should return active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      const activeSession = result.current.getActiveSession();
      expect(activeSession?.id).toBe('session-1');
    });

    it('should return undefined when no active session', () => {
      const { result } = renderHook(() => useTerminalStore());

      const activeSession = result.current.getActiveSession();
      expect(activeSession).toBeUndefined();
    });
  });

  describe('getSessions', () => {
    it('should return all sessions as array', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
        result.current.addSession('session-2', 5678);
      });

      const sessions = result.current.getSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[1].id).toBe('session-2');
    });

    it('should return sessions sorted by creation time', async () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('session-1', 1234);
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      act(() => {
        result.current.addSession('session-2', 5678);
      });

      const sessions = result.current.getSessions();
      expect(sessions[0].createdAt).toBeLessThanOrEqual(sessions[1]?.createdAt || Infinity);
    });
  });

  describe('serializedStates', () => {
    it('should set and get serialized state', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('s1', 1);
        result.current.setSerializedState('s1', 'serialized-content');
      });

      expect(result.current.getSerializedState('s1')).toBe('serialized-content');
    });

    it('should return undefined for non-existent serialized state', () => {
      const { result } = renderHook(() => useTerminalStore());

      expect(result.current.getSerializedState('non-existent')).toBeUndefined();
    });

    it('should clean up serialized state when session is removed', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('s1', 1);
        result.current.setSerializedState('s1', 'content');
        result.current.removeSession('s1');
      });

      expect(result.current.getSerializedState('s1')).toBeUndefined();
    });
  });

  describe('pendingData', () => {
    it('should append and consume pending data', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('s1', 1);
        result.current.appendPendingData('s1', 'chunk1');
        result.current.appendPendingData('s1', 'chunk2');
      });

      let consumed: string[] = [];
      act(() => {
        consumed = result.current.consumePendingData('s1');
      });

      expect(consumed).toEqual(['chunk1', 'chunk2']);
    });

    it('should clear pending data after consume', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('s1', 1);
        result.current.appendPendingData('s1', 'chunk1');
      });

      act(() => {
        result.current.consumePendingData('s1');
      });

      let consumed: string[] = [];
      act(() => {
        consumed = result.current.consumePendingData('s1');
      });

      expect(consumed).toEqual([]);
    });

    it('should return empty array when no pending data', () => {
      const { result } = renderHook(() => useTerminalStore());

      let consumed: string[] = [];
      act(() => {
        consumed = result.current.consumePendingData('non-existent');
      });

      expect(consumed).toEqual([]);
    });

    it('should clean up pending data when session is removed', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('s1', 1);
        result.current.appendPendingData('s1', 'chunk1');
        result.current.removeSession('s1');
      });

      let consumed: string[] = [];
      act(() => {
        consumed = result.current.consumePendingData('s1');
      });

      expect(consumed).toEqual([]);
    });
  });

  describe('tab switching round-trip', () => {
    it('should preserve content across tab switch: serialize → switch → restore', () => {
      const { result } = renderHook(() => useTerminalStore());

      act(() => {
        result.current.addSession('s1', 1);
        result.current.addSession('s2', 2);
      });

      act(() => {
        // Simulate: serialize s1 before switching
        result.current.setSerializedState('s1', 'terminal-content-s1');
        result.current.setActiveSession('s2');
      });

      act(() => {
        // Simulate: background data arrives for s1
        result.current.appendPendingData('s1', '\nnew-output');
      });

      // Switch back to s1: read serialized + pending
      act(() => {
        result.current.setActiveSession('s1');
      });

      const serialized = result.current.getSerializedState('s1');
      const pending = result.current.pendingData.get('s1') || [];
      const restored = (serialized || '') + pending.join('');

      expect(restored).toBe('terminal-content-s1\nnew-output');
    });
  });
});

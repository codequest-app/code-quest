import { create } from 'zustand';
import type { SessionType, TerminalSession, TerminalStore } from '../types';

/**
 * Terminal store using Zustand
 * Manages terminal sessions and socket state
 */
export const useTerminalStore = create<TerminalStore>((set, get) => ({
  sessions: new Map<string, TerminalSession>(),
  activeSessionId: null,
  socketState: {
    connected: false,
    error: null,
  },
  serializedStates: new Map<string, string>(),
  pendingData: new Map<string, string[]>(),

  addSession: (id: string, pid: number, type: SessionType = 'terminal') => {
    set((state) => {
      const sessions = new Map(state.sessions);

      // Determine if this should be the active session
      const shouldBeActive = sessions.size === 0;

      sessions.set(id, {
        id,
        pid,
        type,
        isActive: shouldBeActive,
        createdAt: Date.now(),
      });

      // Update isActive for all sessions
      if (shouldBeActive) {
        return {
          sessions,
          activeSessionId: id,
        };
      }

      return { sessions };
    });
  },

  removeSession: (id: string) => {
    set((state) => {
      const sessions = new Map(state.sessions);

      if (!sessions.has(id)) {
        return state;
      }

      sessions.delete(id);

      // Clean up serialized state and pending data
      const serializedStates = new Map(state.serializedStates);
      serializedStates.delete(id);
      const pendingData = new Map(state.pendingData);
      pendingData.delete(id);

      // If we removed the active session, activate another one
      let newActiveSessionId = state.activeSessionId;

      if (state.activeSessionId === id) {
        if (sessions.size > 0) {
          // Activate the first remaining session
          newActiveSessionId = Array.from(sessions.keys())[0];
          const newActiveSession = sessions.get(newActiveSessionId);
          if (newActiveSession) {
            sessions.set(newActiveSessionId, {
              ...newActiveSession,
              isActive: true,
            });
          }
        } else {
          newActiveSessionId = null;
        }
      }

      return {
        sessions,
        activeSessionId: newActiveSessionId,
        serializedStates,
        pendingData,
      };
    });
  },

  setActiveSession: (id: string | null) => {
    set((state) => {
      const sessions = new Map(state.sessions);

      // Update isActive for all sessions
      sessions.forEach((session, sessionId) => {
        sessions.set(sessionId, {
          ...session,
          isActive: sessionId === id,
        });
      });

      return {
        sessions,
        activeSessionId: id,
      };
    });
  },

  setSocketConnected: (connected: boolean) => {
    set((state) => ({
      socketState: {
        connected,
        error: connected ? null : state.socketState.error,
      },
    }));
  },

  setSocketError: (error: string | null) => {
    set((state) => ({
      socketState: {
        ...state.socketState,
        error,
      },
    }));
  },

  getSession: (id: string) => {
    return get().sessions.get(id);
  },

  getActiveSession: () => {
    const state = get();
    if (!state.activeSessionId) {
      return undefined;
    }
    return state.sessions.get(state.activeSessionId);
  },

  getSessions: () => {
    const sessions = Array.from(get().sessions.values());
    // Sort by creation time
    return sessions.sort((a, b) => a.createdAt - b.createdAt);
  },

  setSerializedState: (id: string, state: string) => {
    set((prev) => {
      const serializedStates = new Map(prev.serializedStates);
      serializedStates.set(id, state);
      return { serializedStates };
    });
  },

  getSerializedState: (id: string) => {
    return get().serializedStates.get(id);
  },

  appendPendingData: (id: string, data: string) => {
    set((prev) => {
      const pendingData = new Map(prev.pendingData);
      const existing = pendingData.get(id) || [];
      pendingData.set(id, [...existing, data]);
      return { pendingData };
    });
  },

  consumePendingData: (id: string) => {
    const data = get().pendingData.get(id) || [];
    set((prev) => {
      const pendingData = new Map(prev.pendingData);
      pendingData.delete(id);
      return { pendingData };
    });
    return data;
  },
}));

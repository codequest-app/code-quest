import type { ChatStats } from '@code-quest/shared';
import { useChatStore } from '../chat-store';

beforeEach(() => {
  useChatStore.setState({
    sessionId: null,
    status: 'disconnected',
    messages: [],
    pendingControl: null,
    model: null,
    tools: [],
    stats: null,
  });
});

describe('useChatStore', () => {
  describe('messages', () => {
    it('adds a message', () => {
      const msg = {
        id: '1',
        role: 'user' as const,
        type: 'text' as const,
        content: 'hello',
        timestamp: Date.now(),
      };

      useChatStore.getState().addMessage(msg);

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]).toEqual(msg);
    });

    it('appends to streaming assistant message', () => {
      const msg = {
        id: 'a1',
        role: 'assistant' as const,
        type: 'text' as const,
        content: 'Hello',
        timestamp: Date.now(),
      };
      useChatStore.getState().addMessage(msg);
      useChatStore.getState().appendToLastMessage(' world');

      expect(useChatStore.getState().messages[0].content).toBe('Hello world');
    });

    it('does nothing when appending with no messages', () => {
      useChatStore.getState().appendToLastMessage('text');
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('clears messages', () => {
      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        type: 'text',
        content: 'hi',
        timestamp: Date.now(),
      });
      useChatStore.getState().clearMessages();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });
  });

  describe('session', () => {
    it('sets sessionId', () => {
      useChatStore.getState().setSessionId('s1');
      expect(useChatStore.getState().sessionId).toBe('s1');
    });
  });

  describe('status transitions', () => {
    it('sets status', () => {
      useChatStore.getState().setStatus('idle');
      expect(useChatStore.getState().status).toBe('idle');
    });

    it('transitions to processing', () => {
      useChatStore.getState().setStatus('processing');
      expect(useChatStore.getState().status).toBe('processing');
    });
  });

  describe('pendingControl', () => {
    it('sets pending control request', () => {
      const ctrl = {
        requestId: 'r1',
        subtype: 'tool_approval',
        toolName: 'bash',
      };
      useChatStore.getState().setPendingControl(ctrl);
      expect(useChatStore.getState().pendingControl).toEqual(ctrl);
    });

    it('clears pending control', () => {
      useChatStore.getState().setPendingControl({
        requestId: 'r1',
        subtype: 'tool_approval',
      });
      useChatStore.getState().setPendingControl(null);
      expect(useChatStore.getState().pendingControl).toBeNull();
    });
  });

  describe('model and tools', () => {
    it('stores model from setModel', () => {
      useChatStore.getState().setModel('claude-sonnet-4-20250514');
      expect(useChatStore.getState().model).toBe('claude-sonnet-4-20250514');
    });

    it('stores tools from setTools', () => {
      useChatStore.getState().setTools(['Read', 'Write']);
      expect(useChatStore.getState().tools).toEqual(['Read', 'Write']);
    });

    it('defaults model to null and tools to empty array', () => {
      expect(useChatStore.getState().model).toBeNull();
      expect(useChatStore.getState().tools).toEqual([]);
    });
  });

  describe('stats', () => {
    it('sets stats', () => {
      const stats: ChatStats = {
        costUsd: 0.01,
        durationMs: 1200,
        inputTokens: 100,
        outputTokens: 200,
      };
      useChatStore.getState().setStats(stats);
      expect(useChatStore.getState().stats).toEqual(stats);
    });
  });
});

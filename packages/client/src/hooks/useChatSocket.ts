import type {
  ChatStats,
  ChatStreamEvent,
  ControlRequest,
  ControlResponse,
} from '@code-quest/shared';
import {
  chatAbortSchema,
  chatAllowToolSchema,
  chatControlRespondSchema,
  chatControlSchema,
  chatCreateSchema,
  chatKillSchema,
  chatSendSchema,
} from '@code-quest/shared';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useChatStore } from '../stores/chatStore';
import { useTerminalStore } from '../stores/terminalStore';
import type { SessionType } from '../types';
import { safeValidate } from '../utils/validateAndEmit.ts';
import { useSocket } from './useSocket';

interface UseChatSocketReturn {
  sendMessage: (sessionId: string, message: string) => void;
  abortMessage: (sessionId: string) => void;
  createChat: (provider: 'claude' | 'gemini') => void;
  killChat: (sessionId: string) => void;
  allowTool: (sessionId: string, toolName: string) => void;
  sendControl: (sessionId: string, subtype: string, params?: Record<string, unknown>) => void;
  respondToControl: (
    sessionId: string,
    requestId: string,
    response: Record<string, unknown>,
  ) => void;
}

export function useChatSocket(serverUrl: string): UseChatSocketReturn {
  const { socket, emit } = useSocket(serverUrl);
  const { initChatSession, handleChatEvent, handleControlResponse, handleControlRequest } =
    useChatStore();

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (sessionId: string, provider: string) => {
      initChatSession(sessionId, provider as 'claude' | 'gemini');
      // Auto-initialize control protocol
      emit('chat:control', sessionId, 'initialize', undefined);
      emit('chat:control', sessionId, 'mcp_status', undefined);
    };

    const handleEvent = (sessionId: string, event: ChatStreamEvent) => {
      handleChatEvent(sessionId, event);
    };

    const handleComplete = (sessionId: string, stats: ChatStats) => {
      handleChatEvent(sessionId, { type: 'result', data: { stats } });
    };

    const handleError = (sessionId: string, message: string) => {
      handleChatEvent(sessionId, { type: 'error', data: { message } });
    };

    const handleWorktree = (sessionId: string, worktreePath: string, branch: string) => {
      useChatStore.getState().setWorktreeInfo(sessionId, worktreePath, branch);
    };

    const handleWorktreeCleared = (sessionId: string) => {
      useChatStore.getState().clearWorktreeInfo(sessionId);
    };

    const handleControlRes = (sessionId: string, response: ControlResponse) => {
      handleControlResponse(sessionId, response);
      if (response.success) {
        toast.success(`Control: ${response.requestId.split('-')[0]} succeeded`);
      } else {
        toast.error(`Control error: ${response.error ?? 'Unknown'}`);
      }
    };

    const handleControlReq = (sessionId: string, request: ControlRequest) => {
      handleControlRequest(sessionId, request);
    };

    const handleChatExit = (sessionId: string) => {
      useChatStore.getState().removeChatSession(sessionId);
      useTerminalStore.getState().removeSession(sessionId);
      toast.success(`Session ${sessionId.slice(0, 8)} exited`);
    };

    socket.on('chat:created', handleCreated);
    socket.on('chat:event', handleEvent);
    socket.on('chat:complete', handleComplete);
    socket.on('chat:error', handleError);
    socket.on('chat:exit', handleChatExit);
    socket.on('session:worktree', handleWorktree);
    socket.on('session:worktree-cleared', handleWorktreeCleared);
    socket.on('chat:control-response', handleControlRes);
    socket.on('chat:control-request', handleControlReq);

    return () => {
      socket.off('chat:created', handleCreated);
      socket.off('chat:event', handleEvent);
      socket.off('chat:complete', handleComplete);
      socket.off('chat:error', handleError);
      socket.off('chat:exit', handleChatExit);
      socket.off('session:worktree', handleWorktree);
      socket.off('session:worktree-cleared', handleWorktreeCleared);
      socket.off('chat:control-response', handleControlRes);
      socket.off('chat:control-request', handleControlReq);
    };
  }, [socket, emit, initChatSession, handleChatEvent, handleControlResponse, handleControlRequest]);

  // Listen for chat:created to add session to terminal store
  useEffect(() => {
    if (!socket) return;

    const handleChatCreated = (sessionId: string, provider: string) => {
      const type: SessionType = provider === 'gemini' ? 'gemini-chat' : 'claude-chat';
      useTerminalStore.getState().addSession(sessionId, 0, type);
    };

    socket.on('chat:created', handleChatCreated);
    return () => {
      socket.off('chat:created', handleChatCreated);
    };
  }, [socket]);

  const sendMessage = useCallback(
    (sessionId: string, message: string) => {
      const result = safeValidate(chatSendSchema, { sessionId, message });
      if (!result.success) {
        console.warn('[chat:send] validation failed', result.error);
        return;
      }
      useChatStore.getState().addUserMessage(sessionId, message);
      emit('chat:send', sessionId, message);
    },
    [emit],
  );

  const abortMessage = useCallback(
    (sessionId: string) => {
      const result = safeValidate(chatAbortSchema, { sessionId });
      if (!result.success) {
        console.warn('[chat:abort] validation failed', result.error);
        return;
      }
      emit('chat:abort', sessionId);
    },
    [emit],
  );

  const createChat = useCallback(
    (provider: 'claude' | 'gemini') => {
      const result = safeValidate(chatCreateSchema, { provider });
      if (!result.success) {
        console.warn('[chat:create] validation failed', result.error);
        return;
      }
      emit('chat:create', { provider });
    },
    [emit],
  );

  const killChat = useCallback(
    (sessionId: string) => {
      const result = safeValidate(chatKillSchema, { sessionId });
      if (!result.success) {
        console.warn('[chat:kill] validation failed', result.error);
        return;
      }
      emit('chat:kill', sessionId);
      useChatStore.getState().removeChatSession(sessionId);
    },
    [emit],
  );

  const allowTool = useCallback(
    (sessionId: string, toolName: string) => {
      const result = safeValidate(chatAllowToolSchema, { sessionId, toolName });
      if (!result.success) {
        console.warn('[chat:allow-tool] validation failed', result.error);
        return;
      }
      emit('chat:allow-tool', sessionId, toolName);
      useChatStore.getState().allowTool(sessionId, toolName);
    },
    [emit],
  );

  const sendControl = useCallback(
    (sessionId: string, subtype: string, params?: Record<string, unknown>) => {
      const result = safeValidate(chatControlSchema, { sessionId, subtype, params });
      if (!result.success) {
        console.warn('[chat:control] validation failed', result.error);
        return;
      }
      emit('chat:control', sessionId, subtype, params);
      useChatStore.getState().addControlEventLog(sessionId, {
        direction: 'sent',
        type: subtype,
        payload: params,
      });
    },
    [emit],
  );

  const respondToControl = useCallback(
    (sessionId: string, requestId: string, response: Record<string, unknown>) => {
      const result = safeValidate(chatControlRespondSchema, { sessionId, requestId, response });
      if (!result.success) {
        console.warn('[chat:control-respond] validation failed', result.error);
        return;
      }
      emit('chat:control-respond', sessionId, requestId, response);
      useChatStore.getState().clearPendingControlRequest(sessionId, requestId);
    },
    [emit],
  );

  return {
    sendMessage,
    abortMessage,
    createChat,
    killChat,
    allowTool,
    sendControl,
    respondToControl,
  };
}

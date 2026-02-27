import { act, renderHook } from '@testing-library/react';
import { useChatStore } from '../../stores/chat-store';
import { makeFakeSocket } from '../../test/make-fake-socket';
import { useChat } from '../use-chat';

beforeEach(() => {
  useChatStore.setState({
    sessionId: null,
    status: 'disconnected',
    messages: [],
    pendingControl: null,
    stats: null,
  });
});

describe('useChat', () => {
  it('connects socket and sets status to idle', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));

    expect(socket.connect).toHaveBeenCalled();
    expect(useChatStore.getState().status).toBe('idle');
  });

  it('sets status to disconnected on socket disconnect', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));

    act(() => socket._emitter.emit('disconnect'));
    expect(useChatStore.getState().status).toBe('disconnected');
  });

  it('createSession emits chat:create and sets sessionId', () => {
    const socket = makeFakeSocket();
    const { result } = renderHook(() => useChat(socket));

    act(() => result.current.createSession());

    expect(socket.emit).toHaveBeenCalledWith('chat:create', {}, expect.any(Function));
    expect(useChatStore.getState().sessionId).toBe('session-1');
    expect(useChatStore.getState().status).toBe('idle');
  });

  it('sendMessage adds user message and emits chat:send', () => {
    const socket = makeFakeSocket();
    const { result } = renderHook(() => useChat(socket));

    act(() => result.current.createSession());
    act(() => result.current.sendMessage('hello'));

    expect(useChatStore.getState().messages[0]).toMatchObject({
      role: 'user',
      type: 'text',
      content: 'hello',
    });
    expect(useChatStore.getState().status).toBe('processing');
    expect(socket.emit).toHaveBeenCalledWith('chat:send', {
      sessionId: 'session-1',
      message: 'hello',
    });
  });

  it('handles text stream event', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => {
      useChatStore.getState().setSessionId('s1');
    });

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'text', content: 'Hello' },
      });
    });

    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0]).toMatchObject({
      role: 'assistant',
      type: 'text',
      content: 'Hello',
    });

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'text', content: ' world' },
      });
    });

    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe('Hello world');
  });

  it('handles thinking event', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => useChatStore.getState().setSessionId('s1'));

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'thinking', content: 'Hmm...' },
      });
    });

    expect(useChatStore.getState().messages[0]).toMatchObject({
      role: 'assistant',
      type: 'thinking',
      content: 'Hmm...',
    });
  });

  it('handles tool_use event', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => useChatStore.getState().setSessionId('s1'));

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'tool_use', id: 't1', name: 'bash', input: { cmd: 'ls' } },
      });
    });

    expect(useChatStore.getState().messages[0]).toMatchObject({
      role: 'assistant',
      type: 'tool_use',
      content: 'bash',
      meta: { toolId: 't1', input: { cmd: 'ls' } },
    });
  });

  it('handles tool_result event', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => useChatStore.getState().setSessionId('s1'));

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'tool_result', id: 't1', name: 'bash', output: 'file.txt' },
      });
    });

    expect(useChatStore.getState().messages[0]).toMatchObject({
      role: 'assistant',
      type: 'tool_result',
      content: 'file.txt',
      meta: { toolId: 't1', name: 'bash' },
    });
  });

  it('handles result event — sets stats and status idle', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => {
      useChatStore.getState().setSessionId('s1');
      useChatStore.getState().setStatus('processing');
    });

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'result', stats: { costUsd: 0.01, durationMs: 500 } },
      });
    });

    expect(useChatStore.getState().stats).toEqual({ costUsd: 0.01, durationMs: 500 });
    expect(useChatStore.getState().status).toBe('idle');
  });

  it('handles error event', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => useChatStore.getState().setSessionId('s1'));

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: { type: 'error', message: 'something broke' },
      });
    });

    expect(useChatStore.getState().messages[0]).toMatchObject({
      role: 'system',
      type: 'error',
      content: 'something broke',
    });
    expect(useChatStore.getState().status).toBe('idle');
  });

  it('handles control_request event', () => {
    const socket = makeFakeSocket();
    renderHook(() => useChat(socket));
    act(() => useChatStore.getState().setSessionId('s1'));

    act(() => {
      socket._emitter.emit('chat:event', {
        sessionId: 's1',
        event: {
          type: 'control_request',
          requestId: 'r1',
          subtype: 'tool_approval',
          toolName: 'bash',
          input: { cmd: 'rm -rf' },
        },
      });
    });

    expect(useChatStore.getState().pendingControl).toEqual({
      requestId: 'r1',
      subtype: 'tool_approval',
      toolName: 'bash',
      input: { cmd: 'rm -rf' },
    });
    expect(useChatStore.getState().messages[0]).toMatchObject({
      type: 'control_request',
      content: 'bash',
    });
  });

  it('respondToControl emits chat:control_response and clears pending', () => {
    const socket = makeFakeSocket();
    const { result } = renderHook(() => useChat(socket));

    act(() => {
      useChatStore.getState().setSessionId('s1');
      useChatStore.getState().setPendingControl({
        requestId: 'r1',
        subtype: 'tool_approval',
        toolName: 'bash',
      });
    });

    act(() => result.current.respondToControl({ allowed: true }));

    expect(socket.emit).toHaveBeenCalledWith('chat:control_response', {
      sessionId: 's1',
      requestId: 'r1',
      response: { allowed: true },
    });
    expect(useChatStore.getState().pendingControl).toBeNull();
  });

  it('abort emits chat:abort', () => {
    const socket = makeFakeSocket();
    const { result } = renderHook(() => useChat(socket));

    act(() => useChatStore.getState().setSessionId('s1'));
    act(() => result.current.abort());

    expect(socket.emit).toHaveBeenCalledWith('chat:abort', { sessionId: 's1' });
  });

  it('cleans up listeners on unmount', () => {
    const socket = makeFakeSocket();
    const { unmount } = renderHook(() => useChat(socket));

    unmount();

    expect(socket.off).toHaveBeenCalled();
  });
});

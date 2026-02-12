import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';
import type { ChatStreamEvent } from '../../types';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      chatSessions: new Map(),
    });
  });

  it('should init chat session', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    const session = store.getChatSession('session-1');
    expect(session).toBeDefined();
    expect(session!.provider).toBe('claude');
    expect(session!.messages).toEqual([]);
    expect(session!.isProcessing).toBe(false);
  });

  it('should add user message', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Hello!');

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session!.messages).toHaveLength(1);
    expect(session!.messages[0].role).toBe('user');
    expect(session!.messages[0].content).toBe('Hello!');
    expect(session!.isProcessing).toBe(true);
  });

  it('should append stream delta to current assistant message', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Hello!');

    const textEvent: ChatStreamEvent = { type: 'text', data: { content: 'Hi' } };
    useChatStore.getState().handleChatEvent('session-1', textEvent);

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session!.messages).toHaveLength(2);
    expect(session!.messages[1].role).toBe('assistant');
    expect(session!.messages[1].content).toBe('Hi');
    expect(session!.messages[1].isStreaming).toBe(true);

    // Append more text
    const textEvent2: ChatStreamEvent = { type: 'text', data: { content: ' there!' } };
    useChatStore.getState().handleChatEvent('session-1', textEvent2);

    const session2 = useChatStore.getState().getChatSession('session-1');
    expect(session2!.messages[1].content).toBe('Hi there!');
  });

  it('should handle thinking events', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Think about this');

    const thinkingEvent: ChatStreamEvent = { type: 'thinking', data: { content: 'Hmm...' } };
    useChatStore.getState().handleChatEvent('session-1', thinkingEvent);

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session!.messages[1].thinking).toBe('Hmm...');
  });

  it('should handle tool_use events', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Read a file');

    const toolUseEvent: ChatStreamEvent = {
      type: 'tool_use',
      data: { name: 'Read', input: { file_path: 'test.ts' } },
    };
    useChatStore.getState().handleChatEvent('session-1', toolUseEvent);

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session!.messages[1].toolUse).toHaveLength(1);
    expect(session!.messages[1].toolUse![0].name).toBe('Read');
  });

  it('should finalize assistant message on result', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Hello!');

    useChatStore.getState().handleChatEvent('session-1', {
      type: 'text',
      data: { content: 'Hi!' },
    });

    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: { costUsd: 0.001, durationMs: 500 } },
    });

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session!.messages[1].isStreaming).toBe(false);
    expect(session!.messages[1].stats).toEqual({ costUsd: 0.001, durationMs: 500 });
    expect(session!.isProcessing).toBe(false);
  });

  it('should track processing state', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    expect(useChatStore.getState().getChatSession('session-1')!.isProcessing).toBe(false);

    store.addUserMessage('session-1', 'Hello');
    expect(useChatStore.getState().getChatSession('session-1')!.isProcessing).toBe(true);

    useChatStore.getState().handleChatEvent('session-1', {
      type: 'text',
      data: { content: 'Hi' },
    });
    expect(useChatStore.getState().getChatSession('session-1')!.isProcessing).toBe(true);

    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: {} },
    });
    expect(useChatStore.getState().getChatSession('session-1')!.isProcessing).toBe(false);
  });

  it('should remove chat session', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    useChatStore.getState().removeChatSession('session-1');
    expect(useChatStore.getState().getChatSession('session-1')).toBeUndefined();
  });
});

import type { ChatStreamEvent, ControlRequest, ControlResponse } from '@code-quest/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from '../chatStore';

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
    expect(session?.provider).toBe('claude');
    expect(session?.messages).toEqual([]);
    expect(session?.isProcessing).toBe(false);
  });

  it('should add user message', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Hello!');

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0].role).toBe('user');
    expect(session?.messages[0].content).toBe('Hello!');
    expect(session?.isProcessing).toBe(true);
  });

  it('should append stream delta to current assistant message', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Hello!');

    const textEvent: ChatStreamEvent = { type: 'text', data: { content: 'Hi' } };
    useChatStore.getState().handleChatEvent('session-1', textEvent);

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.messages).toHaveLength(2);
    expect(session?.messages[1].role).toBe('assistant');
    expect(session?.messages[1].content).toBe('Hi');
    expect(session?.messages[1].isStreaming).toBe(true);

    // Append more text
    const textEvent2: ChatStreamEvent = { type: 'text', data: { content: ' there!' } };
    useChatStore.getState().handleChatEvent('session-1', textEvent2);

    const session2 = useChatStore.getState().getChatSession('session-1');
    expect(session2?.messages[1].content).toBe('Hi there!');
  });

  it('should handle thinking events', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Think about this');

    const thinkingEvent: ChatStreamEvent = { type: 'thinking', data: { content: 'Hmm...' } };
    useChatStore.getState().handleChatEvent('session-1', thinkingEvent);

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.messages[1].thinking).toBe('Hmm...');
  });

  it('should handle tool_use events', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Read a file');

    const toolUseEvent: ChatStreamEvent = {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    };
    useChatStore.getState().handleChatEvent('session-1', toolUseEvent);

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.messages[1].toolUse).toHaveLength(1);
    expect(session?.messages[1].toolUse?.[0].name).toBe('Read');
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
    expect(session?.messages[1].isStreaming).toBe(false);
    expect(session?.messages[1].stats).toEqual({ costUsd: 0.001, durationMs: 500 });
    expect(session?.isProcessing).toBe(false);
  });

  it('should track processing state', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    expect(useChatStore.getState().getChatSession('session-1')?.isProcessing).toBe(false);

    store.addUserMessage('session-1', 'Hello');
    expect(useChatStore.getState().getChatSession('session-1')?.isProcessing).toBe(true);

    useChatStore.getState().handleChatEvent('session-1', {
      type: 'text',
      data: { content: 'Hi' },
    });
    expect(useChatStore.getState().getChatSession('session-1')?.isProcessing).toBe(true);

    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: {} },
    });
    expect(useChatStore.getState().getChatSession('session-1')?.isProcessing).toBe(false);
  });

  it('should init session with empty allowedTools', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    const session = store.getChatSession('session-1');
    expect(session?.allowedTools).toEqual([]);
  });

  it('should trigger pendingPermission on result when tool_use has no matching tool_result', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Read a file');

    // tool_use without a matching tool_result = denied
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    });
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'text',
      data: { content: 'I need permission to read that file.' },
    });
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: {} },
    });

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.pendingPermission).toBeDefined();
    expect(session?.pendingPermission?.toolName).toBe('Read');
  });

  it('should NOT trigger pendingPermission when tool_use has matching tool_result', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Read a file');

    // tool_use followed by tool_result = executed successfully
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    });
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'tool_result',
      data: { name: 'Read', output: 'file contents here' },
    });
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: {} },
    });

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.pendingPermission).toBeUndefined();
  });

  it('should NOT trigger pendingPermission when denied tool is already in allowedTools', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.allowTool('session-1', 'Read');
    store.addUserMessage('session-1', 'Read a file');

    // tool_use without tool_result, but tool already allowed
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    });
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: {} },
    });

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.pendingPermission).toBeUndefined();
  });

  it('should add tool to allowedTools and clear pendingPermission via allowTool', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');
    store.addUserMessage('session-1', 'Read a file');

    // Simulate denied tool flow
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'tool_use',
      data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
    });
    useChatStore.getState().handleChatEvent('session-1', {
      type: 'result',
      data: { stats: {} },
    });

    // Allow the tool
    useChatStore.getState().allowTool('session-1', 'Read');

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.allowedTools).toContain('Read');
    expect(session?.pendingPermission).toBeUndefined();
  });

  it('should not duplicate tools in allowedTools', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    store.allowTool('session-1', 'Read');
    store.allowTool('session-1', 'Read');

    const session = useChatStore.getState().getChatSession('session-1');
    expect(session?.allowedTools).toEqual(['Read']);
  });

  it('should remove chat session', () => {
    const store = useChatStore.getState();
    store.initChatSession('session-1', 'claude');

    useChatStore.getState().removeChatSession('session-1');
    expect(useChatStore.getState().getChatSession('session-1')).toBeUndefined();
  });

  describe('AskUserQuestion', () => {
    it('should set pendingQuestion (not pendingPermission) when AskUserQuestion tool_use has no result', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');
      store.addUserMessage('session-1', 'Help me');

      const questionsInput = {
        questions: [
          {
            question: 'Which approach?',
            header: 'Approach',
            options: [
              { label: 'Option A', description: 'First approach' },
              { label: 'Option B', description: 'Second approach' },
            ],
            multiSelect: false,
          },
        ],
      };

      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_use',
        data: { id: 'toolu_ask_1', name: 'AskUserQuestion', input: questionsInput },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'text',
        data: { content: 'I need your input.' },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'result',
        data: { stats: {} },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.pendingQuestion).toBeDefined();
      expect(session?.pendingQuestion?.questions).toHaveLength(1);
      expect(session?.pendingQuestion?.questions[0].question).toBe('Which approach?');
      expect(session?.pendingPermission).toBeUndefined();
    });

    it('should still trigger pendingPermission for other denied tools alongside AskUserQuestion', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');
      store.addUserMessage('session-1', 'Do something');

      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_use',
        data: {
          id: 'toolu_ask_1',
          name: 'AskUserQuestion',
          input: { questions: [{ question: 'Q?', options: [{ label: 'A' }] }] },
        },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_use',
        data: { id: 'toolu_2', name: 'Bash', input: { command: 'rm -rf /' } },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'result',
        data: { stats: {} },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.pendingQuestion).toBeDefined();
      expect(session?.pendingPermission).toBeDefined();
      expect(session?.pendingPermission?.toolName).toBe('Bash');
    });

    it('should clear pendingQuestion via clearPendingQuestion', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');
      store.addUserMessage('session-1', 'Help me');

      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_use',
        data: {
          id: 'toolu_ask_1',
          name: 'AskUserQuestion',
          input: { questions: [{ question: 'Q?', options: [{ label: 'A' }] }] },
        },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'result',
        data: { stats: {} },
      });

      // Verify it's set
      expect(useChatStore.getState().getChatSession('session-1')?.pendingQuestion).toBeDefined();

      // Clear it
      useChatStore.getState().clearPendingQuestion('session-1');
      expect(useChatStore.getState().getChatSession('session-1')?.pendingQuestion).toBeUndefined();
    });

    it('should set pendingQuestion even when CLI auto-deny produces tool_result for AskUserQuestion', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');
      store.addUserMessage('session-1', 'Help me');

      const questionsInput = {
        questions: [
          {
            question: 'Which approach?',
            header: 'Approach',
            options: [
              { label: 'Option A', description: 'First approach' },
              { label: 'Option B', description: 'Second approach' },
            ],
          },
        ],
      };

      // tool_use arrives
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_use',
        data: { id: 'toolu_ask_1', name: 'AskUserQuestion', input: questionsInput },
      });
      // CLI auto-deny produces a tool_result, clearing it from unresolvedToolUses
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_result',
        data: { name: 'AskUserQuestion', output: 'User denied this request' },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'text',
        data: { content: 'I see the question was denied.' },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'result',
        data: { stats: {} },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      // Should still detect AskUserQuestion even though tool_result cleared unresolvedToolUses
      expect(session?.pendingQuestion).toBeDefined();
      expect(session?.pendingQuestion?.questions).toHaveLength(1);
      expect(session?.pendingQuestion?.questions[0].question).toBe('Which approach?');
      expect(session?.pendingPermission).toBeUndefined();
    });

    it('should not set pendingQuestion for other denied tools (not AskUserQuestion)', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');
      store.addUserMessage('session-1', 'Read a file');

      useChatStore.getState().handleChatEvent('session-1', {
        type: 'tool_use',
        data: { id: 'toolu_1', name: 'Read', input: { file_path: 'test.ts' } },
      });
      useChatStore.getState().handleChatEvent('session-1', {
        type: 'result',
        data: { stats: {} },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.pendingQuestion).toBeUndefined();
      expect(session?.pendingPermission).toBeDefined();
      expect(session?.pendingPermission?.toolName).toBe('Read');
    });
  });

  describe('Control Protocol', () => {
    it('should merge controlInfo on successful control response', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      const response: ControlResponse = {
        requestId: 'initialize-001',
        success: true,
        response: {
          models: [{ value: 'opus', displayName: 'Opus', description: 'Best model' }],
          pid: 12345,
        },
      };

      useChatStore.getState().handleControlResponse('session-1', response);

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlInfo?.models).toHaveLength(1);
      expect(session?.controlInfo?.models?.[0].value).toBe('opus');
      expect(session?.controlInfo?.pid).toBe(12345);
    });

    it('should merge multiple control responses into controlInfo', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r1',
        success: true,
        response: { pid: 100 },
      });
      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r2',
        success: true,
        response: { outputStyle: 'concise', availableOutputStyles: ['concise', 'verbose'] },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlInfo?.pid).toBe(100);
      expect(session?.controlInfo?.outputStyle).toBe('concise');
    });

    it('should add error message on failed control response', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r1',
        success: false,
        error: 'Model not found',
      });

      const session = useChatStore.getState().getChatSession('session-1');
      const lastMsg = session?.messages[session.messages.length - 1];
      expect(lastMsg?.role).toBe('system');
      expect(lastMsg?.content).toContain('Model not found');
    });

    it('should set pendingControlRequest on control request', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      const request: ControlRequest = {
        requestId: 'req-001',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: { command: 'ls' },
      };

      useChatStore.getState().handleControlRequest('session-1', request);

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.pendingControlRequest).toBeDefined();
      expect(session?.pendingControlRequest?.requestId).toBe('req-001');
      expect(session?.pendingControlRequest?.subtype).toBe('can_use_tool');
      expect(session?.pendingControlRequest?.toolName).toBe('Bash');
    });

    it('should clear pendingControlRequest', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlRequest('session-1', {
        requestId: 'req-001',
        subtype: 'can_use_tool',
      });

      expect(
        useChatStore.getState().getChatSession('session-1')?.pendingControlRequest,
      ).toBeDefined();

      useChatStore.getState().clearPendingControlRequest('session-1');

      expect(
        useChatStore.getState().getChatSession('session-1')?.pendingControlRequest,
      ).toBeUndefined();
    });

    it('should merge permissionMode into controlInfo', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r1',
        success: true,
        response: { permissionMode: 'acceptEdits' },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlInfo?.permissionMode).toBe('acceptEdits');
    });

    it('should merge maxThinkingTokens into controlInfo', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r1',
        success: true,
        response: { maxThinkingTokens: 4096 },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlInfo?.maxThinkingTokens).toBe(4096);
    });

    it('should merge mcpServers into controlInfo', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r1',
        success: true,
        response: {
          mcpServers: [
            { name: 'mcp-git', status: 'connected' },
            { name: 'mcp-fs', status: 'failed', error: 'timeout' },
          ],
        },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlInfo?.mcpServers).toHaveLength(2);
      expect(session?.controlInfo?.mcpServers?.[1].error).toBe('timeout');
    });

    it('should write to controlEventLog on handleControlResponse', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlResponse('session-1', {
        requestId: 'r1',
        success: true,
        response: { pid: 123 },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlEventLog).toHaveLength(1);
      expect(session?.controlEventLog?.[0].direction).toBe('received');
      expect(session?.controlEventLog?.[0].type).toBe('r1');
      expect(session?.controlEventLog?.[0].payload).toEqual({
        success: true,
        response: { pid: 123 },
      });
    });

    it('should write to controlEventLog on handleControlRequest', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().handleControlRequest('session-1', {
        requestId: 'req-001',
        subtype: 'can_use_tool',
        toolName: 'Bash',
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlEventLog).toHaveLength(1);
      expect(session?.controlEventLog?.[0].direction).toBe('received');
      expect(session?.controlEventLog?.[0].type).toBe('can_use_tool');
    });

    it('should append to controlEventLog via addControlEventLog', () => {
      const store = useChatStore.getState();
      store.initChatSession('session-1', 'claude');

      useChatStore.getState().addControlEventLog('session-1', {
        direction: 'sent',
        type: 'set_model',
        payload: { model: 'opus' },
      });

      const session = useChatStore.getState().getChatSession('session-1');
      expect(session?.controlEventLog).toHaveLength(1);
      expect(session?.controlEventLog?.[0].direction).toBe('sent');
      expect(session?.controlEventLog?.[0].type).toBe('set_model');
    });

    it('should ignore control response for non-existent session', () => {
      useChatStore.getState().handleControlResponse('nonexistent', {
        requestId: 'r1',
        success: true,
        response: { pid: 1 },
      });
      // Should not throw
      expect(useChatStore.getState().getChatSession('nonexistent')).toBeUndefined();
    });
  });
});

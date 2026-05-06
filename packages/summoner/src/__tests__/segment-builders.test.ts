import { beforeEach, describe, expect, it } from 'vitest';
import { createSegments } from '../test/segment-builders.ts';

const parse = (s: string) => JSON.parse(s) as Record<string, unknown>;

// Minimal template stubs — only the fields each builder reads/writes
const TEMPLATES = {
  INIT: JSON.stringify({
    type: 'system',
    subtype: 'init',
    session_id: '',
    uuid: '',
    model: '',
    tools: [],
    permissionMode: 'default',
    fast_mode_state: null,
    mcp_servers: [],
    slash_commands: [],
    current_repo: null,
  }),
  ASSISTANT_TEXT: JSON.stringify({
    type: 'assistant',
    uuid: '',
    parent_tool_use_id: null,
    message: { id: '', content: [{ type: 'text', text: '' }] },
  }),
  ASSISTANT_TOOL: JSON.stringify({
    type: 'assistant',
    uuid: '',
    parent_tool_use_id: null,
    message: { id: '', content: [{ type: 'tool_use', id: '', name: '', input: {} }] },
  }),
  THINKING: JSON.stringify({
    type: 'assistant',
    uuid: '',
    parent_tool_use_id: null,
    message: { id: '', content: [{ type: 'thinking', thinking: '' }] },
  }),
  RESULT_SUCCESS: JSON.stringify({
    type: 'result',
    subtype: 'success',
    uuid: '',
    duration_ms: 0,
    duration_api_ms: 0,
    total_cost_usd: 0,
  }),
  RESULT_ERROR: JSON.stringify({
    type: 'result',
    subtype: 'error_during_execution',
    is_error: false,
    uuid: '',
    duration_ms: 0,
    duration_api_ms: 0,
    total_cost_usd: 0,
  }),
  RESULT_IS_ERROR_NO_ERRORS: JSON.stringify({
    type: 'result',
    subtype: 'error_during_execution',
    is_error: true,
    result: '',
    uuid: '',
    duration_ms: 0,
    duration_api_ms: 0,
    total_cost_usd: 0,
  }),
  RESULT_RESUME_NOT_FOUND: JSON.stringify({
    type: 'result',
    subtype: 'error_during_execution',
    is_error: false,
    uuid: '',
    errors: [],
    duration_ms: 0,
    duration_api_ms: 0,
    total_cost_usd: 0,
  }),
  CONTROL_CANCEL_REQUEST: JSON.stringify({ type: 'control_cancel_request', request_id: '' }),
  STATUS: JSON.stringify({
    type: 'system',
    subtype: 'status',
    uuid: '',
    status: null,
    permissionMode: 'default',
  }),
  TASK_STARTED: JSON.stringify({
    type: 'system',
    subtype: 'task_started',
    uuid: '',
    tool_use_id: '',
    description: '',
    task_id: '',
  }),
  AGENT_TOOL: JSON.stringify({
    type: 'assistant',
    uuid: '',
    parent_tool_use_id: null,
    message: {
      id: '',
      model: 'claude-opus-4-6',
      usage: { input_tokens: 0, output_tokens: 0 },
      content: [{ type: 'tool_use', id: '', name: 'Agent', input: {} }],
    },
  }),
  USER_TEXT: JSON.stringify({
    type: 'user',
    uuid: '',
    message: { content: [{ type: 'text', text: '' }] },
  }),
  TOOL_RESULT: JSON.stringify({
    type: 'tool_result',
    uuid: '',
    parent_tool_use_id: null,
    message: { content: [{ type: 'tool_result', tool_use_id: '', content: '', is_error: false }] },
  }),
  CONTROL_RESPONSE: JSON.stringify({
    type: 'control_response',
    response: { request_id: '', response: {} },
  }),
  CONTROL_RESPONSE_ERROR: JSON.stringify({
    type: 'control_response',
    response: { request_id: '', error: '' },
  }),
} as const;

describe('createSegments', () => {
  const { segments, resetSeq } = createSegments(TEMPLATES);

  describe('returns JSON strings', () => {
    it('init returns a string', () => {
      expect(typeof segments.init('s1')).toBe('string');
    });

    it('assistant returns a string', () => {
      expect(typeof segments.assistant('hi')).toBe('string');
    });

    it('result returns a string', () => {
      expect(typeof segments.result()).toBe('string');
    });
  });

  describe('user', () => {
    it('sets text in message content', () => {
      const line = parse(segments.user('hello user'));
      const msg = line.message as Record<string, unknown>;
      const content = (msg.content as Record<string, unknown>[])[0];
      expect(content?.text).toBe('hello user');
    });

    it('accepts custom uuid', () => {
      const line = parse(segments.user('hi', { uuid: 'my-uuid' }));
      expect(line.uuid).toBe('my-uuid');
    });
  });

  describe('_seq reset', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('produces deterministic UUIDs after reset', () => {
      const a = parse(segments.init('s1'));
      expect(a.uuid).toBe('fake-init-1');
      const b = parse(segments.assistant('hi'));
      expect(b.uuid).toBe('fake-asst-2');
    });

    it('reset brings counter back to 0', () => {
      segments.init('s1');
      segments.init('s2');
      resetSeq();
      const c = parse(segments.init('s3'));
      expect(c.uuid).toBe('fake-init-1');
    });
  });

  describe('thinking', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('produces assistant with thinking content block', () => {
      const line = parse(segments.thinking('analyzing the problem'));
      expect(line.type).toBe('assistant');
      const content = (line.message as Record<string, unknown[]>).content![0] as Record<
        string,
        unknown
      >;
      expect(content.type).toBe('thinking');
      expect(content.thinking).toBe('analyzing the problem');
    });
  });

  describe('controlCancelRequest', () => {
    it('produces control_cancel_request', () => {
      const line = parse(segments.controlCancelRequest('req-42'));
      expect(line.type).toBe('control_cancel_request');
      expect(line.request_id).toBe('req-42');
    });
  });

  describe('parentToolUseId', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('assistant text defaults parent_tool_use_id to null', () => {
      const line = parse(segments.assistant('hello'));
      expect(line.parent_tool_use_id).toBeNull();
    });

    it('assistant text accepts parentToolUseId option', () => {
      const line = parse(segments.assistant('hello', { parentToolUseId: 'toolu_parent' }));
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });

    it('toolResult accepts parentToolUseId option', () => {
      const line = parse(
        segments.toolResult('toolu_1', 'content', { parentToolUseId: 'toolu_parent' }),
      );
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });

    it('toolResult defaults parent_tool_use_id to null', () => {
      const line = parse(segments.toolResult('toolu_1', 'content'));
      expect(line.parent_tool_use_id).toBeNull();
    });
  });

  describe('status', () => {
    it('produces system/status with status text', () => {
      const line = parse(segments.status({ status: 'Reading file...' }));
      expect(line.type).toBe('system');
      expect(line.subtype).toBe('status');
      expect(line.status).toBe('Reading file...');
    });

    it('produces system/status with permissionMode', () => {
      const line = parse(segments.status({ permissionMode: 'plan' }));
      expect(line.permissionMode).toBe('plan');
      expect(line.status).toBeNull();
    });
  });

  describe('taskStarted', () => {
    it('produces system/task_started', () => {
      const line = parse(segments.taskStarted('toolu_abc', 'Explore codebase'));
      expect(line.type).toBe('system');
      expect(line.subtype).toBe('task_started');
      expect(line.tool_use_id).toBe('toolu_abc');
      expect(line.description).toBe('Explore codebase');
    });
  });

  describe('agent', () => {
    it('produces assistant with Agent tool_use block', () => {
      const line = parse(segments.agent('toolu_1', 'Explore project structure'));
      expect(line.type).toBe('assistant');
      const msg = line.message as Record<string, unknown>;
      const content = (msg.content as Record<string, unknown>[])[0];
      expect(content?.type).toBe('tool_use');
      expect(content?.name).toBe('Agent');
      const input = content?.input as Record<string, unknown>;
      expect(input?.description).toBe('Explore project structure');
    });

    it('includes subagent_type in input when provided', () => {
      const line = parse(segments.agent('toolu_1', 'Explore project', { subagentType: 'Explore' }));
      const msg = line.message as Record<string, unknown>;
      const content = (msg.content as Record<string, unknown>[])[0];
      const input = content?.input as Record<string, unknown>;
      expect(input?.subagent_type).toBe('Explore');
    });

    it('accepts parentToolUseId option', () => {
      const line = parse(
        segments.agent('toolu_1', 'Sub task', { parentToolUseId: 'toolu_parent' }),
      );
      expect(line.parent_tool_use_id).toBe('toolu_parent');
    });
  });

  describe('resultError', () => {
    beforeEach(() => {
      resetSeq();
    });

    it('produces result with error_during_execution subtype', () => {
      const line = parse(segments.resultError());
      expect(line.type).toBe('result');
      expect(line.subtype).toBe('error_during_execution');
      expect(line.is_error).toBe(false);
    });

    it('accepts optional durationMs', () => {
      const line = parse(segments.resultError({ durationMs: 5000 }));
      expect(line.duration_ms).toBe(5000);
    });
  });

  describe('controlResponse', () => {
    it('produces control_response type', () => {
      const line = parse(segments.controlResponse('req-1'));
      expect(line.type).toBe('control_response');
    });

    it('controlResponseError produces control_response type', () => {
      const line = parse(segments.controlResponseError('req-1', 'some error'));
      expect(line.type).toBe('control_response');
    });
  });
});

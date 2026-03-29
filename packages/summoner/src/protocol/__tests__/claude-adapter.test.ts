// biome-ignore-all lint/suspicious/noExplicitAny: SocketEvent payload is Record<string,unknown>, needs cast in assertions
import { describe, expect, it } from 'vitest';
import { resetSeq, segments as s } from '../../test/fake-claude.ts';
import { ClaudeAdapter } from '../claude-adapter.ts';

const adapter = new ClaudeAdapter();

/** Extract the ProtocolEvent from a parseLine result, handling 'ok', 'unknown', and 'error' statuses */
function parseEvent(line: string) {
  const parsed = adapter.parseLine(line);
  if (parsed.status === 'ok') return parsed.event;
  if (parsed.status === 'unknown') return parsed.data as any;
  if (parsed.status === 'error') return JSON.parse(parsed.raw) as any;
  return null;
}

/** Helper: parseLine + transform → extract single SocketEvent (or null / array) */
function toSocketEvent(line: string) {
  const event = parseEvent(line);
  if (!event) return null;
  const r = adapter.transform(event);
  return r.events.length === 0 ? null : r.events.length === 1 ? r.events[0] : r.events;
}

function transformResult(line: string) {
  const event = parseEvent(line);
  if (!event) return { events: [], autoResponses: [], controlResponses: [], serverActions: [] };
  return adapter.transform(event);
}

describe('ClaudeAdapter', () => {
  beforeEach(() => resetSeq());

  describe('parseLine', () => {
    it('delegates to ClaudeProtocol — parses real init JSON', () => {
      const line = s.init('test-session');
      const result = adapter.parseLine(line);

      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.event).toHaveProperty('type', 'system');
        expect(result.event).toHaveProperty('subtype', 'init');
        expect(result.event).toHaveProperty('session_id', 'test-session');
      }
    });

    it('skips empty lines', () => {
      const result = adapter.parseLine('');
      expect(result.status).toBe('skip');
    });

    it('skips keep_alive', () => {
      const result = adapter.parseLine('{"type":"keep_alive"}');
      expect(result.status).toBe('skip');
    });

    it('returns unknown for unrecognized event types', () => {
      const result = adapter.parseLine('{"type":"totally_unknown_type","data":"foo"}');
      expect(result.status).toBe('unknown');
    });
  });

  describe('transform', () => {
    it('transforms assistant event to message:assistant SocketEvent', () => {
      const line = s.assistant('hello world');
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toHaveLength(1);
      expect(output.events[0]).toMatchObject({
        name: 'message:assistant',
        payload: { content: [{ type: 'text', text: 'hello world' }] },
      });
      expect(output.autoResponses).toHaveLength(0);
      expect(output.controlResponses).toHaveLength(0);
    });

    it('transforms system/init to session:init SocketEvent', () => {
      const line = s.init('sess-1', { model: 'opus' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toHaveLength(1);
      expect(output.events[0]).toMatchObject({
        name: 'session:init',
        payload: { sessionId: 'sess-1', model: 'opus' },
      });
    });

    it('separates auto_respond into autoResponses for open_url', () => {
      const line = s.controlRequest('req-1', 'open_url', undefined, {
        url: 'https://example.com',
      });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toHaveLength(1);
      expect(output.events[0]).toMatchObject({
        name: 'action:open_url',
        payload: { url: 'https://example.com' },
      });

      expect(output.autoResponses).toHaveLength(1);
      expect(output.autoResponses[0]).toMatchObject({
        requestId: 'req-1',
        subtype: 'open_url',
      });
    });

    it('does NOT put read_diff into autoResponses', () => {
      const line = s.controlRequestOpenDiff('req-2', {
        originalFilePath: '/tmp/a.ts',
        newFilePath: '/tmp/b.ts',
      });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.autoResponses).toHaveLength(0);
      expect(output.events).toHaveLength(0);
    });

    it('transforms permission request without autoResponse', () => {
      const line = s.controlRequestBash('req-3', { command: 'ls' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toHaveLength(1);
      expect(output.events[0]).toMatchObject({ name: 'control:permission' });
      expect(output.autoResponses).toHaveLength(0);
    });

    it('transforms control_response into controlResponses', () => {
      const line = s.controlResponse('req-4', { behavior: 'allow' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.controlResponses).toHaveLength(1);
      expect(output.controlResponses[0]).toMatchObject({ requestId: 'req-4' });
      expect(output.events).toHaveLength(0);
    });

    it('transforms stream text delta to stream_chunk', () => {
      const line = s.textDelta('hello');
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toHaveLength(1);
      expect(output.events[0]).toMatchObject({
        name: 'stream:chunk',
        payload: { chunk: { kind: 'text', content: 'hello' } },
      });
    });

    it('transforms result to session_result', () => {
      const line = s.result();
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events.length).toBeGreaterThanOrEqual(1);
      expect(output.events[0]).toMatchObject({ name: 'message:result' });
    });
  });

  // ── Detailed transform coverage (merged from claude-converter.test.ts) ──

  describe('transform — system events', () => {
    it('converts system/init to session:init', () => {
      const result = toSocketEvent(
        s.init('sess-1', {
          model: 'opus',
          tools: ['Read'],
          permissionMode: 'default',
          mcpServers: [{ name: 'test', status: 'connected' }],
        }),
      );

      expect(result).toMatchObject({
        name: 'session:init',
        payload: {
          sessionId: 'sess-1',
          model: 'opus',
          tools: ['Read'],
          mcpServers: [{ name: 'test', status: 'connected' }],
        },
      });
    });

    it('converts system/status to session:status', () => {
      const result = toSocketEvent(s.status({ status: 'processing', permissionMode: 'plan' }));
      expect(result).toMatchObject({
        name: 'session:status',
        payload: { status: 'processing', permissionMode: 'plan' },
      });
    });

    it('converts system/hook_started', () => {
      const result = toSocketEvent(s.hookStarted('h1', 'pre-commit', 'commit'));
      expect(result).toMatchObject({
        name: 'system:hook_started',
        payload: { hook: { hookName: 'pre-commit', hookId: 'h1' } },
      });
    });

    it('converts system/hook_response', () => {
      const base = JSON.parse(s.hookResponse('h1', 'pre-commit', 'commit', 'passed'));
      base.additional_context = 'lint ok';
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'system:hook_response',
        payload: {
          hook: { hookName: 'pre-commit', output: 'passed', additionalContext: 'lint ok' },
        },
      });
    });

    it('converts system/task_started', () => {
      const result = toSocketEvent(s.taskStarted('tu-1', 'Running tests'));
      expect(result).toMatchObject({
        name: 'system:task_started',
        payload: { description: 'Running tests', taskType: 'local_agent' },
      });
    });

    it('converts system/bridge_state', () => {
      const result = toSocketEvent(s.bridgeState('disconnected', 'connection lost'));
      expect(result).toMatchObject({
        name: 'system:remote_control',
        payload: { info: { state: 'disconnected', detail: 'connection lost' } },
      });
    });

    it('converts system/compact_boundary', () => {
      expect(toSocketEvent(s.compactBoundary())).toMatchObject({ name: 'system:compact_boundary' });
    });

    it('converts system/compact_boundary with preservedSegment', () => {
      const result = toSocketEvent(s.compactBoundary({ preservedSegment: true }));
      expect(result).toMatchObject({
        name: 'system:compact_boundary',
        payload: { preservedSegment: true },
      });
    });

    it('skips system/post_turn_summary', () => {
      const raw = JSON.stringify({ type: 'system', subtype: 'post_turn_summary', summary: 'test', session_id: 'x', uuid: 'u' });
      expect(toSocketEvent(raw)).toBeNull();
    });

    it('skips system/session_state_changed', () => {
      const raw = JSON.stringify({ type: 'system', subtype: 'session_state_changed', state: {}, session_id: 'x', uuid: 'u' });
      expect(toSocketEvent(raw)).toBeNull();
    });

    it('converts system/api_retry', () => {
      const raw = JSON.stringify({ type: 'system', subtype: 'api_retry', attempt: 1, max_retries: 10, retry_delay_ms: 500, error_status: 529, error: 'rate_limit', session_id: 'x', uuid: 'u' });
      const result = toSocketEvent(raw);
      expect(result).toMatchObject({
        name: 'system:api_retry',
        payload: { attempt: 1, maxRetries: 10, retryDelayMs: 500, errorStatus: 529, error: 'rate_limit' },
      });
    });

    it('converts system/compact_boundary without compactMetadata', () => {
      const result = toSocketEvent(s.compactBoundary());
      expect((result as any).payload.preservedSegment).toBeUndefined();
    });

    it('converts system/task_notification from real fixture', () => {
      const result = toSocketEvent(
        s.taskNotification('a6b3446e967260f60', {
          toolUseId: 'toolu_01RgfPM8fAEPgezK6JinZ2pH',
          status: 'completed',
          outputFile: '',
          summary: 'Read all protocol docs and extract protocol list',
          usage: { total_tokens: 106775, tool_uses: 37, duration_ms: 117816 },
        }),
      );
      expect(result).toMatchObject({
        name: 'system:task_notification',
        payload: {
          taskId: 'a6b3446e967260f60',
          toolUseId: 'toolu_01RgfPM8fAEPgezK6JinZ2pH',
          status: 'completed',
        },
      });
    });

    it('converts system/task_notification with only task_id', () => {
      const base = JSON.parse(s.taskNotification('a6b3446e967260f60'));
      delete base.tool_use_id;
      delete base.status;
      delete base.output_file;
      delete base.summary;
      delete base.usage;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'system:task_notification',
        payload: { taskId: 'a6b3446e967260f60' },
      });
      expect((result as any).payload.toolUseId).toBeUndefined();
      expect((result as any).payload.status).toBeUndefined();
    });

    it('converts system/task_progress from real fixture', () => {
      const result = toSocketEvent(
        s.taskProgress('a6b3446e967260f60', {
          toolUseId: 'toolu_01RgfPM8fAEPgezK6JinZ2pH',
          description: 'Finding files matching pattern...',
          lastToolName: 'Glob',
          usage: { total_tokens: 12483, tool_uses: 1, duration_ms: 2366 },
        }),
      );
      expect(result).toMatchObject({
        name: 'system:task_progress',
        payload: {
          taskId: 'a6b3446e967260f60',
          toolUseId: 'toolu_01RgfPM8fAEPgezK6JinZ2pH',
          description: 'Finding files matching pattern...',
          lastToolName: 'Glob',
        },
      });
    });

    it('converts system/task_progress with only task_id', () => {
      const base = JSON.parse(s.taskProgress('a6b3446e967260f60'));
      delete base.tool_use_id;
      delete base.description;
      delete base.last_tool_name;
      delete base.usage;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'system:task_progress',
        payload: { taskId: 'a6b3446e967260f60' },
      });
      expect((result as any).payload.description).toBeUndefined();
      expect((result as any).payload.lastToolName).toBeUndefined();
    });
  });

  describe('transform — message events', () => {
    it('converts assistant with text/thinking/tool_use', () => {
      const base = JSON.parse(s.assistant('hello'));
      base.message.content = [
        { type: 'thinking', thinking: 'let me think...' },
        { type: 'tool_use', id: 'tu-2', name: 'Read', input: { path: 'a.ts' } },
        { type: 'text', text: 'hello' },
      ];
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'message:assistant',
        payload: {
          content: [
            { type: 'thinking', thinking: 'let me think...' },
            { type: 'tool_use', toolName: 'Read' },
            { type: 'text', text: 'hello' },
          ],
        },
      });
    });

    it('converts user with tool_result', () => {
      const base = JSON.parse(s.toolResult('tu-1', 'output'));
      base.message.content = [
        { type: 'tool_result', tool_use_id: 'tu-1', name: 'Bash', content: 'output' },
        { type: 'text', text: 'user said' },
      ];
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'message:user',
        payload: {
          content: [
            { type: 'tool_result', toolUseId: 'tu-1' },
            { type: 'text', text: 'user said' },
          ],
        },
      });
    });

    it('converts result with stats', () => {
      const base = JSON.parse(s.result());
      base.total_cost_usd = 0.05;
      base.duration_ms = 1234;
      base.usage = { input_tokens: 100, output_tokens: 200 };
      base.num_turns = 3;
      base.errors = ['something failed'];
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'message:result',
        payload: {
          stats: { totalCostUsd: 0.05, inputTokens: 100, outputTokens: 200 },
          errors: ['something failed'],
        },
      });
    });
  });

  describe('transform — stream events', () => {
    it('converts content_block_start to stream:block_start', () => {
      const base = JSON.parse(s.contentBlockStart(0, 'thinking'));
      base.event.content_block = { type: 'thinking', thinking: '', signature: '' };
      base.parent_tool_use_id = null;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'stream:block_start',
        payload: { index: 0, blockType: 'thinking' },
      });
      expect((result as any).payload.parentToolUseId).toBeUndefined();
    });

    it('converts content_block_start with parentToolUseId', () => {
      const result = toSocketEvent(
        s.contentBlockStart(1, 'text', { parentToolUseId: 'toolu_123' }),
      );
      expect(result).toMatchObject({
        name: 'stream:block_start',
        payload: { index: 1, blockType: 'text', parentToolUseId: 'toolu_123' },
      });
    });

    it('converts content_block_start for tool_use block', () => {
      const base = JSON.parse(s.contentBlockStart(2, 'tool_use'));
      base.event.content_block = { type: 'tool_use', id: 'toolu_abc', name: 'Read' };
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'stream:block_start',
        payload: {
          index: 2,
          blockType: 'tool_use',
          contentBlock: { type: 'tool_use', id: 'toolu_abc', name: 'Read' },
        },
      });
    });

    it('converts text_delta to stream:chunk', () => {
      expect(toSocketEvent(s.textDelta('hello'))).toMatchObject({
        name: 'stream:chunk',
        payload: { chunk: { kind: 'text', content: 'hello' } },
      });
    });

    it('converts thinking_delta', () => {
      expect(toSocketEvent(s.thinkingDelta('hmm'))).toMatchObject({
        name: 'stream:chunk',
        payload: { chunk: { kind: 'thinking', content: 'hmm' } },
      });
    });

    it('converts message_stop to stream:end', () => {
      expect(toSocketEvent(s.messageStop())).toMatchObject({ name: 'stream:end', payload: {} });
    });

    it('skips signature_delta', () => {
      expect(toSocketEvent(s.signatureDelta('sig'))).toBeNull();
    });

    it('skips compaction_delta', () => {
      const raw = JSON.stringify({ type: 'stream_event', event: { type: 'content_block_delta', index: 0, delta: { type: 'compaction_delta', content: 'compressed' } }, session_id: 'x', uuid: 'u' });
      expect(toSocketEvent(raw)).toBeNull();
    });
  });

  describe('transform — control requests', () => {
    it('converts can_use_tool → control:permission', () => {
      const result = toSocketEvent(
        s.controlRequest('cr-1', 'can_use_tool', 'Bash', { command: 'ls' }),
      );
      expect(result).toMatchObject({
        name: 'control:permission',
        payload: { requestId: 'cr-1', toolName: 'Bash' },
      });
    });

    it('converts hook_callback → control:hook_callback', () => {
      const base = JSON.parse(s.controlRequest('hc-1', 'hook_callback'));
      base.request.callback_id = 'cb-123';
      base.request.input = {};
      base.request.tool_use_id = 'tu-99';
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'control:hook_callback',
        payload: { requestId: 'hc-1', callbackId: 'cb-123', toolUseId: 'tu-99' },
      });
    });

    it('converts elicitation → control:elicitation', () => {
      const result = toSocketEvent(
        s.controlRequestElicitation('el-1', { message: 'Your name?', mode: 'text' }),
      );
      expect(result).toMatchObject({
        name: 'control:elicitation',
        payload: { requestId: 'el-1', prompt: 'Your name?', inputType: 'text' },
      });
    });

    it('converts get_settings → auto_respond ServerAction', () => {
      const result = transformResult(s.controlRequest('gs-1', 'get_settings'));
      expect(result.events).toHaveLength(0);
      expect(result.serverActions).toMatchObject([
        { action: 'auto_respond', requestId: 'gs-1', subtype: 'get_settings' },
      ]);
    });

    it('converts initialize → passthrough (no auto_respond, no events)', () => {
      const result = transformResult(s.controlRequest('init-1', 'initialize'));
      expect(result.events).toHaveLength(0);
      expect(result.serverActions).toHaveLength(0);
    });

    it('converts mcp_message notification → auto_respond ServerAction', () => {
      const result = transformResult(
        s.controlRequest('mcp-1', 'mcp_message', undefined, {
          server_name: 'test',
          message: { method: 'notifications/initialized' },
        }),
      );
      expect(result.events).toHaveLength(0);
      expect(result.autoResponses).toMatchObject([
        { requestId: 'mcp-1', subtype: 'mcp_notification' },
      ]);
    });

    it('converts mcp_message request (has id) → control:mcp', () => {
      const result = toSocketEvent(
        s.controlRequest('mcp-2', 'mcp_message', undefined, {
          server_name: 'test',
          message: { method: 'tools/list', id: 42 },
        }),
      );
      expect(result).toMatchObject({ name: 'control:mcp', payload: { serverName: 'test' } });
    });

    it('converts show_notification → notification:show + auto_respond', () => {
      const result = transformResult(
        s.controlRequestShowNotification('sn-1', {
          message: 'Task completed successfully',
          severity: 'info',
          buttons: ['OK', 'Details'],
          onlyIfNotVisible: true,
        }),
      );
      expect(result.events).toMatchObject([
        {
          name: 'notification:show',
          payload: {
            message: 'Task completed successfully',
            severity: 'info',
            buttons: ['OK', 'Details'],
            onlyIfNotVisible: true,
          },
        },
      ]);
      expect(result.autoResponses).toMatchObject([
        {
          requestId: 'sn-1',
          subtype: 'show_notification',
          response: { type: 'show_notification_response' },
        },
      ]);
    });

    it('converts show_notification with severity=error', () => {
      const result = transformResult(
        s.controlRequestShowNotification('sn-2', {
          message: 'Something went wrong',
          severity: 'error',
        }),
      );
      expect(result.events).toMatchObject([
        {
          name: 'notification:show',
          payload: { message: 'Something went wrong', severity: 'error' },
        },
      ]);
    });

    it('converts show_notification with defaults when fields missing', () => {
      const result = transformResult(
        s.controlRequestShowNotification('sn-3', { message: 'Hello' }),
      );
      expect(result.events).toMatchObject([
        {
          name: 'notification:show',
          payload: { message: 'Hello', severity: 'info' },
        },
      ]);
    });

    it('converts unknown subtype → forward_to_client ServerAction', () => {
      const result = transformResult(s.controlRequest('gen-1', 'some_unknown', 'CustomTool'));
      expect(result.events).toHaveLength(0);
      expect(result.serverActions).toMatchObject([
        {
          action: 'forward_to_client',
          requestId: 'gen-1',
          subtype: 'some_unknown',
          toolName: 'CustomTool',
        },
      ]);
    });
  });

  describe('transform — misc events', () => {
    it('returns null for keep_alive', () => {
      const parsed = adapter.parseLine(JSON.stringify({ type: 'keep_alive' }));
      expect(parsed.status).toBe('skip');
      expect(toSocketEvent(JSON.stringify({ type: 'keep_alive' }))).toBeNull();
    });

    it('returns null for control_response', () => {
      expect(toSocketEvent(s.controlResponse('r1'))).toBeNull();
    });

    it('converts error', () => {
      expect(toSocketEvent(s.error('boom'))).toMatchObject({
        name: 'error:message',
        payload: { message: 'boom' },
      });
    });

    it('converts notification', () => {
      expect(toSocketEvent(s.notification('hello'))).toMatchObject({
        name: 'notification:toast',
        payload: { message: 'hello' },
      });
    });

    it('converts auth_url', () => {
      expect(toSocketEvent(s.authUrl('https://auth.test', 'oauth'))).toMatchObject({
        name: 'notification:auth_url',
        payload: { url: 'https://auth.test' },
      });
    });

    it('converts streamlined_text', () => {
      expect(toSocketEvent(s.streamlinedText('fast'))).toMatchObject({
        name: 'stream:text',
        payload: { text: 'fast' },
      });
    });

    it('converts streamlined_tool_use_summary', () => {
      expect(toSocketEvent(s.streamlinedToolUseSummary('Read 3'))).toMatchObject({
        name: 'stream:tool_summary',
        payload: { toolSummary: 'Read 3' },
      });
    });

    it('converts unknown type to raw:event', () => {
      expect(toSocketEvent(s.rawUnknown('some_future_thing', { data: 123 }))).toMatchObject({
        name: 'raw:event',
        payload: { rawType: 'some_future_thing' },
      });
    });

    it('converts control_cancel_request', () => {
      expect(toSocketEvent(s.controlCancelRequest('cc-1'))).toMatchObject({
        name: 'control:cancel',
        payload: { requestId: 'cc-1' },
      });
    });

    it('converts auth_status to structured SocketEvent', () => {
      const result = toSocketEvent(
        JSON.stringify({
          type: 'auth_status',
          isAuthenticating: false,
          output: ['Logged in as user@example.com'],
          account: { email: 'user@example.com', plan: 'pro' },
        }),
      );
      expect(result).toMatchObject({
        name: 'notification:auth_status',
        payload: {
          status: 'authenticated',
          output: 'Logged in as user@example.com',
          account: { email: 'user@example.com', plan: 'pro' },
        },
      });
    });

    it('converts auth_status with isAuthenticating=true', () => {
      const result = toSocketEvent(
        JSON.stringify({ type: 'auth_status', isAuthenticating: true, output: [] }),
      );
      expect(result).toMatchObject({
        name: 'notification:auth_status',
        payload: { status: 'authenticating' },
      });
    });

    it('converts auth_status without optional fields', () => {
      const result = toSocketEvent(
        JSON.stringify({ type: 'auth_status', isAuthenticating: false, output: [] }),
      );
      expect(result).toMatchObject({
        name: 'notification:auth_status',
        payload: { status: 'authenticated' },
      });
      expect((result as any).payload.account).toBeUndefined();
    });

    it('converts rate_limit_event with overage fields', () => {
      const result = toSocketEvent(
        s.rateLimitEvent({
          status: 'rate_limited',
          rateLimitType: '5hr',
          overageStatus: 'active',
          isUsingOverage: true,
        }),
      );
      expect(result).toMatchObject({
        name: 'system:rate_limit',
        payload: {
          info: { status: 'rate_limited', overageStatus: 'active', isUsingOverage: true },
        },
      });
    });

    it('converts rate_limit_event without overage fields (backward compat)', () => {
      const base = JSON.parse(s.rateLimitEvent({ status: 'ok' }));
      delete base.rate_limit_info.overageStatus;
      delete base.rate_limit_info.isUsingOverage;
      delete base.rate_limit_info.rateLimitType;
      delete base.rate_limit_info.resetsAt;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'system:rate_limit',
        payload: { info: { status: 'ok' } },
      });
      expect((result as any).payload.info.overageStatus).toBeUndefined();
      expect((result as any).payload.info.isUsingOverage).toBeUndefined();
    });
  });

  describe('transform — permission_request fields', () => {
    it('extracts blockedPath, decisionReason, agentId from can_use_tool', () => {
      const base = JSON.parse(
        s.controlRequest('cr-perm-1', 'can_use_tool', 'Bash', { command: 'rm -rf /' }),
      );
      base.request.tool_use_id = 'toolu_1';
      base.request.blocked_path = '/etc/passwd';
      base.request.decision_reason = 'Dangerous command detected';
      base.request.agent_id = 'agent-42';
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'control:permission',
        payload: {
          requestId: 'cr-perm-1',
          toolName: 'Bash',
          blockedPath: '/etc/passwd',
          decisionReason: 'Dangerous command detected',
          agentId: 'agent-42',
        },
      });
    });

    it('handles can_use_tool without new fields (backward compat)', () => {
      const base = JSON.parse(s.controlRequest('cr-perm-2', 'can_use_tool', 'Read', {}));
      delete base.request.blocked_path;
      delete base.request.decision_reason;
      delete base.request.agent_id;
      delete base.request.permission_suggestions;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'control:permission',
        payload: { requestId: 'cr-perm-2', toolName: 'Read' },
      });
      expect((result as any).payload.blockedPath).toBeUndefined();
      expect((result as any).payload.decisionReason).toBeUndefined();
      expect((result as any).payload.agentId).toBeUndefined();
    });

    it('preserves empty string blocked_path', () => {
      const base = JSON.parse(s.controlRequest('cr-perm-3', 'can_use_tool', 'Write', {}));
      base.request.blocked_path = '';
      const result = toSocketEvent(JSON.stringify(base));
      expect((result as any).payload.blockedPath).toBe('');
    });
  });

  describe('transform — elicitation_request fields', () => {
    it('extracts elicitationId, mcpServerName, requestedSchema', () => {
      const schema = { properties: { name: { type: 'string' }, age: { type: 'number' } } };
      const base = JSON.parse(
        s.controlRequestElicitation('el-ext-1', {
          message: 'Fill this out',
          mode: 'form',
          requestedSchema: schema,
        }),
      );
      base.request.elicitation_id = 'elic-99';
      base.request.mcp_server_name = 'test-server';
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'control:elicitation',
        payload: {
          requestId: 'el-ext-1',
          prompt: 'Fill this out',
          inputType: 'select',
          options: ['name', 'age'],
          elicitationId: 'elic-99',
          mcpServerName: 'test-server',
          requestedSchema: schema,
        },
      });
    });

    it('still populates options from requested_schema.properties keys', () => {
      const result = toSocketEvent(
        s.controlRequestElicitation('el-ext-2', {
          message: 'Choose',
          mode: 'form',
          requestedSchema: { properties: { a: {}, b: {}, c: {} } },
        }),
      );
      expect((result as any).payload.options).toEqual(['a', 'b', 'c']);
    });

    it('handles elicitation without new fields (backward compat)', () => {
      const base = JSON.parse(
        s.controlRequestElicitation('el-ext-3', { message: 'Name?', mode: 'text' }),
      );
      delete base.request.elicitation_id;
      delete base.request.mcp_server_name;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'control:elicitation',
        payload: { requestId: 'el-ext-3', prompt: 'Name?', inputType: 'text' },
      });
      expect((result as any).payload.elicitationId).toBeUndefined();
      expect((result as any).payload.mcpServerName).toBeUndefined();
      expect((result as any).payload.requestedSchema).toBeUndefined();
    });
  });

  describe('transform — result fields', () => {
    it('extracts isError and subtype from result event with errors → emits [message:result, error:message]', () => {
      const base = JSON.parse(s.result());
      base.is_error = true;
      base.subtype = 'error_max_turns';
      base.total_cost_usd = 0.1;
      base.duration_ms = 5000;
      base.usage = { input_tokens: 100, output_tokens: 50 };
      base.errors = ['Max turns exceeded'];
      const result = transformResult(JSON.stringify(base));
      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toMatchObject({
        name: 'message:result',
        payload: { isError: true, subtype: 'error_max_turns' },
      });
      expect(result.events[1]).toMatchObject({
        name: 'error:message',
        payload: { message: 'Max turns exceeded' },
      });
    });

    it('result with is_error but no errors array → emits only message:result', () => {
      const base = JSON.parse(s.result());
      base.is_error = true;
      base.subtype = 'error_max_turns';
      delete base.errors;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({
        name: 'message:result',
        payload: { isError: true, subtype: 'error_max_turns' },
      });
    });

    it('handles result without is_error/subtype (backward compat)', () => {
      const base = JSON.parse(s.result());
      base.total_cost_usd = 0.05;
      base.duration_ms = 1000;
      base.usage = {};
      delete base.is_error;
      delete base.subtype;
      const result = toSocketEvent(JSON.stringify(base));
      expect(result).toMatchObject({ name: 'message:result' });
      expect((result as any).payload.isError).toBeUndefined();
      expect((result as any).payload.subtype).toBeUndefined();
    });
  });

  describe('format methods', () => {
    it('formatMessage produces valid CLI stdin JSON', () => {
      const json = adapter.formatMessage('hello');
      const parsed = JSON.parse(json);
      expect(parsed).toMatchObject({
        type: 'user',
        message: { role: 'user', content: [{ type: 'text', text: 'hello' }] },
      });
    });

    it('formatControlResponse produces valid CLI stdin JSON', () => {
      const json = adapter.formatControlResponse('req-1', { behavior: 'allow' });
      const parsed = JSON.parse(json);
      expect(parsed).toMatchObject({
        type: 'control_response',
        response: { subtype: 'success', request_id: 'req-1', response: { behavior: 'allow' } },
      });
    });

    it('formatControlRequest produces valid CLI stdin JSON', () => {
      const json = adapter.formatControlRequest('set_model', { model: 'opus' });
      const parsed = JSON.parse(json);
      expect(parsed).toMatchObject({
        type: 'control_request',
        request: { subtype: 'set_model', model: 'opus' },
      });
      expect(parsed.request_id).toBeDefined();
    });
  });

  describe('command and buildArgs', () => {
    it('exposes command', () => {
      expect(adapter.command).toBe('claude');
    });

    it('builds args with options', () => {
      const args = adapter.buildArgs({ model: 'opus' });
      expect(args).toContain('--model');
      expect(args).toContain('opus');
    });
  });
});

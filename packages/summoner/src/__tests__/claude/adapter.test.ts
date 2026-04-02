// biome-ignore-all lint/suspicious/noExplicitAny: SocketEvent payload is Record<string,unknown>, needs cast in assertions
import { describe, expect, it } from 'vitest';
import { resetSeq, segments as s } from '../../test/fake-claude.ts';
import { adapter, toSocketEvent, transformResult } from './helpers.ts';

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
      expect(output.serverActions).toHaveLength(0);
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

    it('open_url produces single event with requestId and response (no serverActions)', () => {
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
        payload: {
          requestId: 'req-1',
          url: 'https://example.com',
          response: { type: 'open_url_response' },
        },
      });
      expect(output.serverActions).toHaveLength(0);
    });

    it('open_diff produces control:open_diff event (no serverActions)', () => {
      const line = s.controlRequestOpenDiff('req-2', {
        originalFilePath: '/tmp/a.ts',
        newFilePath: '/tmp/b.ts',
      });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toMatchObject([
        {
          name: 'control:open_diff',
          payload: { requestId: 'req-2', originalPath: '/tmp/a.ts', newPath: '/tmp/b.ts' },
        },
      ]);
      expect(output.serverActions).toHaveLength(0);
    });

    it('transforms permission request into control:permission event', () => {
      const line = s.controlRequestBash('req-3', { command: 'ls' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.event);

      expect(output.events).toHaveLength(1);
      expect(output.events[0]).toMatchObject({ name: 'control:permission' });
      expect(output.serverActions).toHaveLength(0);
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

  describe('formatRequest', () => {
    it('maps settings:set_model to set_model subtype', () => {
      const result = adapter.formatRequest('settings:set_model', { model: 'haiku' });
      expect(result).toEqual({ subtype: 'set_model', input: { model: 'haiku' } });
    });

    it('maps settings:set_permission_mode to set_permission_mode subtype', () => {
      const result = adapter.formatRequest('settings:set_permission_mode', { mode: 'plan' });
      expect(result).toEqual({ subtype: 'set_permission_mode', input: { mode: 'plan' } });
    });

    it('maps mcp:reconnect to mcp_reconnect subtype', () => {
      const result = adapter.formatRequest('mcp:reconnect', { serverName: 'test' });
      expect(result).toEqual({ subtype: 'mcp_reconnect', input: { server_name: 'test' } });
    });

    it('maps message:interrupt to interrupt subtype', () => {
      const result = adapter.formatRequest('message:interrupt', {});
      expect(result).toEqual({ subtype: 'interrupt', input: {} });
    });

    it('throws for unknown event name', () => {
      expect(() => adapter.formatRequest('unknown:event', {})).toThrow();
    });
  });
});

import { resetSeq, segments as s } from '@code-quest/test-kit';
import { describe, expect, it } from 'vitest';
import { adapter, toClientMessage } from './helpers.ts';

describe('ClaudeAdapter', () => {
  beforeEach(() => resetSeq());

  describe('parseLine', () => {
    it('delegates to ClaudeProtocol — parses real init JSON', () => {
      const line = s.init('test-session');
      const result = adapter.parseLine(line);

      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.message).toHaveProperty('type', 'system');
        expect(result.message).toHaveProperty('subtype', 'init');
        expect(result.message).toHaveProperty('session_id', 'test-session');
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
    it('transforms assistant to message:assistant ClientMessage', () => {
      const line = s.assistant('hello world');
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.messages).toHaveLength(1);
      expect(output.messages[0]).toMatchObject({
        name: 'message:assistant',
        payload: { content: [{ type: 'text', text: 'hello world' }] },
      });
      expect(output.controlResponses).toHaveLength(0);
    });

    it('transforms system/init to session:init ClientMessage', () => {
      const line = s.init('sess-1', { model: 'opus' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.messages).toHaveLength(1);
      expect(output.messages[0]).toMatchObject({
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

      const output = adapter.transform(parsed.message);

      expect(output.messages).toHaveLength(1);
      expect(output.messages[0]).toMatchObject({
        name: 'action:open_url',
        payload: {
          requestId: 'req-1',
          url: 'https://example.com',
          response: { type: 'open_url_response' },
        },
      });
    });

    it('open_diff produces control:open_diff event (no serverActions)', () => {
      const line = s.controlRequestOpenDiff('req-2', {
        originalFilePath: '/tmp/a.ts',
        newFilePath: '/tmp/b.ts',
      });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.messages).toMatchObject([
        {
          name: 'control:open_diff',
          payload: { requestId: 'req-2', originalPath: '/tmp/a.ts', newPath: '/tmp/b.ts' },
        },
      ]);
    });

    it('transforms permission request into control:permission event', () => {
      const line = s.controlRequestBash('req-3', { command: 'ls' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.messages).toHaveLength(1);
      expect(output.messages[0]).toMatchObject({ name: 'control:permission' });
    });

    it('transforms control_response into controlResponses', () => {
      const line = s.controlResponse('req-4', { behavior: 'allow' });
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.controlResponses).toHaveLength(1);
      expect(output.controlResponses[0]).toMatchObject({ requestId: 'req-4' });
      expect(output.messages).toHaveLength(0);
    });

    it('transforms stream text delta to stream_chunk', () => {
      const line = s.textDelta('hello');
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.messages).toHaveLength(1);
      expect(output.messages[0]).toMatchObject({
        name: 'stream:chunk',
        payload: { chunk: { kind: 'text', content: 'hello' } },
      });
    });

    it('transforms result to session_result', () => {
      const line = s.result();
      const parsed = adapter.parseLine(line);
      expect(parsed.status).toBe('ok');
      if (parsed.status !== 'ok') return;

      const output = adapter.transform(parsed.message);

      expect(output.messages.length).toBeGreaterThanOrEqual(1);
      expect(output.messages[0]).toMatchObject({ name: 'message:result' });
    });
  });

  // ── Detailed transform coverage (merged from claude-converter.test.ts) ──

  describe('transform — misc events', () => {
    it('returns null for keep_alive', () => {
      const parsed = adapter.parseLine(JSON.stringify({ type: 'keep_alive' }));
      expect(parsed.status).toBe('skip');
      expect(toClientMessage(JSON.stringify({ type: 'keep_alive' }))).toBeNull();
    });

    it('returns null for control_response', () => {
      expect(toClientMessage(s.controlResponse('r1'))).toBeNull();
    });

    it('converts unknown type to raw:event', () => {
      expect(toClientMessage(s.rawUnknown('some_future_thing', { data: 123 }))).toMatchObject({
        name: 'raw:event',
        payload: { rawType: 'some_future_thing' },
      });
    });

    it('converts control_cancel_request', () => {
      expect(toClientMessage(s.controlCancelRequest('cc-1'))).toMatchObject({
        name: 'control:cancel',
        payload: { requestId: 'cc-1' },
      });
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

    it('maps transcript:seed_read_state to seed_read_state subtype', () => {
      const result = adapter.formatRequest('transcript:seed_read_state', {
        path: '/src/main.ts',
        mtime: 1711612800000,
      });
      expect(result).toEqual({
        subtype: 'seed_read_state',
        input: { path: '/src/main.ts', mtime: 1711612800000 },
      });
    });

    it('maps mcp:channel_enable to channel_enable subtype with server_name', () => {
      const result = adapter.formatRequest('mcp:channel_enable', { serverName: 'slack-mcp' });
      expect(result).toEqual({ subtype: 'channel_enable', input: { server_name: 'slack-mcp' } });
    });

    it('maps plugin:reload to reload_plugins subtype', () => {
      const result = adapter.formatRequest('plugin:reload', {});
      expect(result).toEqual({ subtype: 'reload_plugins', input: {} });
    });

    it('maps ultrareview:launch to ultrareview_launch subtype', () => {
      const result = adapter.formatRequest('ultrareview:launch', { args: [], confirm: false });
      expect(result).toEqual({
        subtype: 'ultrareview_launch',
        input: { args: [], confirm: false },
      });
    });

    it('throws for unknown event name', () => {
      expect(() => adapter.formatRequest('unknown:event', {})).toThrow();
    });
  });

  describe('mapResponse', () => {
    it('plugin:reload maps response to { data: { commands, agents, plugins, mcpServers } }', () => {
      const response = {
        commands: [{ name: 'simplify', description: 'Review code', argumentHint: '' }],
        agents: [{ name: 'general-purpose', description: 'General agent' }],
        plugins: [{ id: 'p1', name: 'Plugin 1', enabled: true }],
        mcpServers: [{ name: 'github', status: 'connected' }],
      };

      const result = adapter.mapResponse('plugin:reload', response);

      expect(result).toEqual({ data: response });
    });

    it('plugin:reload with partial response still maps correctly', () => {
      const response = { commands: [{ name: 'simplify' }] };
      const result = adapter.mapResponse('plugin:reload', response);
      expect(result).toEqual({ data: { commands: [{ name: 'simplify' }] } });
    });

    it('returns empty object for events without mapResponse', () => {
      const result = adapter.mapResponse('settings:set_model', { model: 'opus' });
      expect(result).toEqual({});
    });
  });
});

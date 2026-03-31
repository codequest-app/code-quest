// biome-ignore-all lint/suspicious/noExplicitAny: SocketEvent payload is Record<string,unknown>, needs cast in assertions
import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/fake-claude.ts';
import { toSocketEvent, transformResult } from '../helpers.ts';

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
    expect(result.serverActions.filter((a) => a.action === 'auto_respond')).toMatchObject([
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
    expect(result.serverActions.filter((a) => a.action === 'auto_respond')).toMatchObject([
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
    const result = transformResult(s.controlRequestShowNotification('sn-3', { message: 'Hello' }));
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

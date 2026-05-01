import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/segments-node.ts';
import { expectName, toClientMessage, transformResult } from '../helpers.ts';

describe('transform — control requests', () => {
  it('converts can_use_tool → control:permission', () => {
    const result = toClientMessage(
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
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'control:hook_callback',
      payload: { requestId: 'hc-1', callbackId: 'cb-123', toolUseId: 'tu-99' },
    });
  });

  it('converts elicitation → control:elicitation', () => {
    const result = toClientMessage(
      s.controlRequestElicitation('el-1', { message: 'Your name?', mode: 'text' }),
    );
    expect(result).toMatchObject({
      name: 'control:elicitation',
      payload: { requestId: 'el-1', prompt: 'Your name?', inputType: 'text' },
    });
  });

  it('converts get_settings → settings:get_settings event', () => {
    const result = transformResult(s.controlRequest('gs-1', 'get_settings'));
    expect(result.messages).toMatchObject([
      { name: 'settings:get_settings', payload: { requestId: 'gs-1' } },
    ]);
  });

  it('converts set_model → settings:model_updated event with input', () => {
    const result = transformResult(
      s.controlRequest('sm-1', 'set_model', undefined, { model: 'haiku' }),
    );
    expect(result.messages).toMatchObject([
      { name: 'settings:model_updated', payload: { requestId: 'sm-1', input: { model: 'haiku' } } },
    ]);
  });

  it('converts set_permission_mode → settings:permission_mode_updated event with input', () => {
    const result = transformResult(
      s.controlRequest('sp-1', 'set_permission_mode', undefined, { mode: 'plan' }),
    );
    expect(result.messages).toMatchObject([
      {
        name: 'settings:permission_mode_updated',
        payload: { requestId: 'sp-1', input: { mode: 'plan' } },
      },
    ]);
  });

  it('converts initialize → passthrough (no events)', () => {
    const result = transformResult(s.controlRequest('init-1', 'initialize'));
    expect(result.messages).toHaveLength(0);
  });

  it('converts mcp_message notification → mcp:auto_respond with requestId and response', () => {
    const result = transformResult(
      s.controlRequest('mcp-1', 'mcp_message', undefined, {
        server_name: 'test',
        message: { method: 'notifications/initialized' },
      }),
    );
    expect(result.messages).toMatchObject([
      { name: 'mcp:auto_respond', payload: { requestId: 'mcp-1', response: { mcp_response: {} } } },
    ]);
  });

  it('converts mcp_message request (has id) → control:mcp', () => {
    const result = toClientMessage(
      s.controlRequest('mcp-2', 'mcp_message', undefined, {
        server_name: 'test',
        message: { method: 'tools/list', id: 42 },
      }),
    );
    expect(result).toMatchObject({ name: 'control:mcp', payload: { serverName: 'test' } });
  });

  it('converts open_url → action:open_url with requestId and auto-respond payload', () => {
    const result = transformResult(
      s.controlRequest('ou-1', 'open_url', undefined, { url: 'https://example.com' }),
    );
    expect(result.messages).toMatchObject([
      {
        name: 'action:open_url',
        payload: {
          requestId: 'ou-1',
          url: 'https://example.com',
          response: { type: 'open_url_response' },
        },
      },
    ]);
  });

  it('converts open_file → action:open_file with requestId and auto-respond payload', () => {
    const result = transformResult(
      s.controlRequest('of-1', 'open_file', undefined, { file_path: '/tmp/foo.ts' }),
    );
    expect(result.messages).toMatchObject([
      {
        name: 'action:open_file',
        payload: {
          requestId: 'of-1',
          filePath: '/tmp/foo.ts',
          response: { type: 'open_file_response' },
        },
      },
    ]);
  });

  it('converts show_notification → notification:show with requestId and auto-respond payload', () => {
    const result = transformResult(
      s.controlRequestShowNotification('sn-1', {
        message: 'Task completed successfully',
        severity: 'info',
        buttons: ['OK', 'Details'],
        onlyIfNotVisible: true,
      }),
    );
    expect(result.messages).toMatchObject([
      {
        name: 'notification:show',
        payload: {
          requestId: 'sn-1',
          message: 'Task completed successfully',
          severity: 'info',
          buttons: ['OK', 'Details'],
          onlyIfNotVisible: true,
          response: { type: 'show_notification_response' },
        },
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
    expect(result.messages).toMatchObject([
      {
        name: 'notification:show',
        payload: { message: 'Something went wrong', severity: 'error' },
      },
    ]);
  });

  it('converts show_notification with defaults when fields missing', () => {
    const result = transformResult(s.controlRequestShowNotification('sn-3', { message: 'Hello' }));
    expect(result.messages).toMatchObject([
      {
        name: 'notification:show',
        payload: { message: 'Hello', severity: 'info' },
      },
    ]);
  });

  it('converts open_diff → control:open_diff event', () => {
    const result = transformResult(
      s.controlRequestOpenDiff('od-1', { originalFilePath: '/tmp/a.ts', newFilePath: '/tmp/b.ts' }),
    );
    expect(result.messages).toMatchObject([
      {
        name: 'control:open_diff',
        payload: { requestId: 'od-1', originalPath: '/tmp/a.ts', newPath: '/tmp/b.ts' },
      },
    ]);
  });

  it('converts unknown subtype → control:forward event', () => {
    const result = transformResult(s.controlRequest('gen-1', 'some_unknown', 'CustomTool'));
    expect(result.messages).toMatchObject([
      {
        name: 'control:forward',
        payload: {
          requestId: 'gen-1',
          subtype: 'some_unknown',
          toolName: 'CustomTool',
        },
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
    const result = toClientMessage(JSON.stringify(base));
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
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'control:permission');
    expect(msg.payload.requestId).toBe('cr-perm-2');
    expect(msg.payload.toolName).toBe('Read');
    expect(msg.payload.blockedPath).toBeUndefined();
    expect(msg.payload.decisionReason).toBeUndefined();
    expect(msg.payload.agentId).toBeUndefined();
  });

  it('preserves empty string blocked_path', () => {
    const base = JSON.parse(s.controlRequest('cr-perm-3', 'can_use_tool', 'Write', {}));
    base.request.blocked_path = '';
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'control:permission');
    expect(msg.payload.blockedPath).toBe('');
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
    const result = toClientMessage(JSON.stringify(base));
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
    const result = toClientMessage(
      s.controlRequestElicitation('el-ext-2', {
        message: 'Choose',
        mode: 'form',
        requestedSchema: { properties: { a: {}, b: {}, c: {} } },
      }),
    );
    const msg = expectName(result, 'control:elicitation');
    expect(msg.payload.options).toEqual(['a', 'b', 'c']);
  });

  it('handles elicitation without new fields (backward compat)', () => {
    const base = JSON.parse(
      s.controlRequestElicitation('el-ext-3', { message: 'Name?', mode: 'text' }),
    );
    delete base.request.elicitation_id;
    delete base.request.mcp_server_name;
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'control:elicitation');
    expect(msg.payload.requestId).toBe('el-ext-3');
    expect(msg.payload.prompt).toBe('Name?');
    expect(msg.payload.inputType).toBe('text');
    expect(msg.payload.elicitationId).toBeUndefined();
    expect(msg.payload.mcpServerName).toBeUndefined();
    expect(msg.payload.requestedSchema).toBeUndefined();
  });
});

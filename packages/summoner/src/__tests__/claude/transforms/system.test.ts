import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/segments.ts';
import { expectName, toClientMessage } from '../helpers.ts';

describe('transform — system events', () => {
  it('converts system/init to session:init', () => {
    const result = toClientMessage(
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
    const result = toClientMessage(s.status({ status: 'processing', permissionMode: 'plan' }));
    expect(result).toMatchObject({
      name: 'session:status',
      payload: { status: 'processing', permissionMode: 'plan' },
    });
  });

  it('converts system/hook_started', () => {
    const result = toClientMessage(s.hookStarted('h1', 'pre-commit', 'commit'));
    expect(result).toMatchObject({
      name: 'system:hook_started',
      payload: { hook: { hookName: 'pre-commit', hookId: 'h1' } },
    });
  });

  it('converts system/hook_response', () => {
    const base = JSON.parse(s.hookResponse('h1', 'pre-commit', 'commit', 'passed'));
    base.additional_context = 'lint ok';
    const result = toClientMessage(JSON.stringify(base));
    expect(result).toMatchObject({
      name: 'system:hook_response',
      payload: {
        hook: { hookName: 'pre-commit', output: 'passed', additionalContext: 'lint ok' },
      },
    });
  });

  it('converts system/task_started', () => {
    const result = toClientMessage(s.taskStarted('tu-1', 'Running tests'));
    expect(result).toMatchObject({
      name: 'system:task_started',
      payload: { description: 'Running tests', taskType: 'local_agent' },
    });
  });

  it('converts system/bridge_state', () => {
    const result = toClientMessage(s.bridgeState('disconnected', 'connection lost'));
    expect(result).toMatchObject({
      name: 'system:remote_control',
      payload: { info: { state: 'disconnected', detail: 'connection lost' } },
    });
  });

  it('converts system/compact_boundary', () => {
    expect(toClientMessage(s.compactBoundary())).toMatchObject({ name: 'system:compact_boundary' });
  });

  it('converts system/compact_boundary with preservedSegment', () => {
    const result = toClientMessage(s.compactBoundary({ preservedSegment: true }));
    expect(result).toMatchObject({
      name: 'system:compact_boundary',
      payload: { preservedSegment: true },
    });
  });

  it('skips system/post_turn_summary', () => {
    const raw = JSON.stringify({
      type: 'system',
      subtype: 'post_turn_summary',
      summary: 'test',
      session_id: 'x',
      uuid: 'u',
    });
    expect(toClientMessage(raw)).toBeNull();
  });

  it('skips system/session_state_changed', () => {
    const raw = JSON.stringify({
      type: 'system',
      subtype: 'session_state_changed',
      state: {},
      session_id: 'x',
      uuid: 'u',
    });
    expect(toClientMessage(raw)).toBeNull();
  });

  it('converts system/api_retry', () => {
    const raw = JSON.stringify({
      type: 'system',
      subtype: 'api_retry',
      attempt: 1,
      max_retries: 10,
      retry_delay_ms: 500,
      error_status: 529,
      error: 'rate_limit',
      session_id: 'x',
      uuid: 'u',
    });
    const result = toClientMessage(raw);
    expect(result).toMatchObject({
      name: 'system:api_retry',
      payload: {
        attempt: 1,
        maxRetries: 10,
        retryDelayMs: 500,
        errorStatus: 529,
        error: 'rate_limit',
      },
    });
  });

  it('converts system/compact_boundary without compactMetadata', () => {
    const result = toClientMessage(s.compactBoundary());
    const msg = expectName(result, 'system:compact_boundary');
    expect(msg.payload.preservedSegment).toBeUndefined();
  });

  it('converts system/task_notification from real fixture', () => {
    const result = toClientMessage(
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
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'system:task_notification');
    expect(msg.payload.taskId).toBe('a6b3446e967260f60');
    expect(msg.payload.toolUseId).toBeUndefined();
    expect(msg.payload.status).toBeUndefined();
  });

  it('converts system/task_progress from real fixture', () => {
    const result = toClientMessage(
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
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'system:task_progress');
    expect(msg.payload.taskId).toBe('a6b3446e967260f60');
    expect(msg.payload.description).toBeUndefined();
    expect(msg.payload.lastToolName).toBeUndefined();
  });
});

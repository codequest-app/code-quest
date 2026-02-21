import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ClaudeStreamParser } from '../parsers/claude-parser.ts';

describe('ClaudeStreamParser (fixture-driven)', () => {
  function loadFixture(name: string): string {
    return readFileSync(new URL(`../__fixtures__/claude/${name}`, import.meta.url), 'utf-8');
  }

  function parseFixture(name: string) {
    const parser = new ClaudeStreamParser();
    const events = loadFixture(name)
      .split('\n')
      .flatMap((line) => parser.parseLine(line));
    return { events, parser };
  }

  // ── Print mode fixtures ──

  it('should parse simple-text fixture', () => {
    const { events } = parseFixture('simple-text.jsonl');

    expect(events).toContainEqual(expect.objectContaining({ type: 'init' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'text' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'result' }));

    const init = events.find((e) => e.type === 'init');
    expect(init?.data).toHaveProperty('sessionId');

    const result = events.find((e) => e.type === 'result');
    const stats = (result?.data as { stats: Record<string, unknown> }).stats;
    expect(stats.costUsd).toBeGreaterThan(0);
    expect(stats.durationMs).toBeGreaterThan(0);
    expect(stats.inputTokens).toBeGreaterThan(0);
    expect(stats.outputTokens).toBeGreaterThan(0);
  });

  it('should parse tool-use-read fixture', () => {
    const { events } = parseFixture('tool-use-read.jsonl');

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    expect(toolUse?.data).toHaveProperty('id');
    expect(toolUse?.data).toHaveProperty('name', 'Read');
    expect(toolUse?.data).toHaveProperty('input');

    const result = events.find((e) => e.type === 'result');
    expect(result).toBeDefined();
    const stats = (result?.data as { stats: Record<string, unknown> }).stats;
    expect(stats.inputTokens).toBeGreaterThan(0);
    expect(stats.outputTokens).toBeGreaterThan(0);

    const errors = events.filter((e) => e.type === 'error');
    expect(errors).toHaveLength(0);
  });

  it('should extract cliSessionId from fixture', () => {
    const { parser } = parseFixture('simple-text.jsonl');
    expect(parser.getCliSessionId()).toBeTruthy();
    expect(typeof parser.getCliSessionId()).toBe('string');
  });

  it('should silently ignore rate_limit_event type', () => {
    const { events } = parseFixture('simple-text.jsonl');

    const errors = events.filter((e) => e.type === 'error');
    expect(errors).toHaveLength(0);

    expect(events.filter((e) => e.type === 'init')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'text')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'result')).toHaveLength(1);
  });

  // ── Control protocol fixtures ──

  it('should parse control-initialize fixture', () => {
    const { events } = parseFixture('control-initialize.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as {
      requestId: string;
      success: boolean;
      response?: { models?: unknown[]; account?: { email: string } };
    };
    expect(data.requestId).toBe('init-001');
    expect(data.success).toBe(true);
    expect(data.response?.models).toHaveLength(3);
    expect(data.response?.account?.email).toBe('user@example.com');

    expect(events).toContainEqual(expect.objectContaining({ type: 'init' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'text' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'result' }));
  });

  it('should parse control-set-model fixture', () => {
    const { events } = parseFixture('control-set-model.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('model-001');
    expect(data.success).toBe(true);
  });

  it('should parse control-set-permission-mode fixture', () => {
    const { events } = parseFixture('control-set-permission-mode.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('perm-001');
    expect(data.success).toBe(true);
  });

  it('should parse control-set-max-thinking-tokens fixture', () => {
    const { events } = parseFixture('control-set-max-thinking-tokens.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('think-001');
    expect(data.success).toBe(true);
  });

  it('should parse control-mcp-status fixture', () => {
    const { events } = parseFixture('control-mcp-status.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('mcp-st-001');
    expect(data.success).toBe(true);
  });

  it('should parse control-interrupt fixture', () => {
    const { events } = parseFixture('control-interrupt.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('int-001');
    expect(data.success).toBe(true);

    expect(events).toContainEqual(expect.objectContaining({ type: 'result' }));
  });

  it('should parse control-response-error fixture', () => {
    const { events } = parseFixture('control-response-error.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean; error?: string };
    expect(data.requestId).toBe('bad-001');
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it('should parse control-rewind-files fixture (error)', () => {
    const { events } = parseFixture('control-rewind-files.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean; error?: string };
    expect(data.requestId).toBe('rw-001');
    expect(data.success).toBe(false);
    expect(data.error).toContain('rewinding');
  });

  it('should parse control-stop-task fixture (error)', () => {
    const { events } = parseFixture('control-stop-task.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean; error?: string };
    expect(data.requestId).toBe('st-001');
    expect(data.success).toBe(false);
    expect(data.error).toContain('No task found');
  });

  it('should parse control-mcp-reconnect fixture (error)', () => {
    const { events } = parseFixture('control-mcp-reconnect.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean; error?: string };
    expect(data.requestId).toBe('mcp-re-001');
    expect(data.success).toBe(false);
    expect(data.error).toContain('Server not found');
  });

  it('should parse control-mcp-toggle fixture (error)', () => {
    const { events } = parseFixture('control-mcp-toggle.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean; error?: string };
    expect(data.requestId).toBe('mcp-tog-001');
    expect(data.success).toBe(false);
    expect(data.error).toContain('Server not found');
  });

  it('should parse control-mcp-set-servers fixture', () => {
    const { events } = parseFixture('control-mcp-set-servers.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('mcp-set-001');
    expect(data.success).toBe(true);
  });

  it('should parse control-request-hook-callback fixture (CLI→Extension)', () => {
    const { events } = parseFixture('control-request-hook-callback.jsonl');

    const controlRequest = events.find((e) => e.type === 'control_request');
    expect(controlRequest).toBeDefined();

    const data = controlRequest?.data as {
      requestId: string;
      subtype: string;
      callbackId?: string;
      toolUseId?: string;
    };
    expect(data.subtype).toBe('hook_callback');
    expect(data.callbackId).toBe('hook_0');
    expect(data.toolUseId).toBeTruthy();
  });

  it('should parse control-request-can-use-tool fixture (CLI→Extension)', () => {
    const { events } = parseFixture('control-request-can-use-tool.jsonl');

    const controlRequest = events.find((e) => e.type === 'control_request');
    expect(controlRequest).toBeDefined();

    const data = controlRequest?.data as {
      requestId: string;
      subtype: string;
      toolName?: string;
      input?: unknown;
    };
    expect(data.subtype).toBe('can_use_tool');
    expect(data.toolName).toBe('Write');
    expect(data.input).toBeDefined();
  });

  it('should parse control-mcp-message fixture', () => {
    const { events } = parseFixture('control-mcp-message.jsonl');

    const controlResponse = events.find((e) => e.type === 'control_response');
    expect(controlResponse).toBeDefined();

    const data = controlResponse?.data as { requestId: string; success: boolean };
    expect(data.requestId).toBe('mcp-msg-001');
    expect(data.success).toBe(true);
  });
});

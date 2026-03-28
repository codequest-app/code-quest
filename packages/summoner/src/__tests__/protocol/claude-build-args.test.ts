import { describe, expect, it } from 'vitest';
import { ClaudeProtocol } from '../../protocol/claude.ts';

describe('ClaudeProtocol.buildArgs', () => {
  const protocol = new ClaudeProtocol();

  it('returns baseArgs when no options', () => {
    const args = protocol.buildArgs();
    expect(args).toContain('--output-format');
    expect(args).toContain('--verbose');
  });

  // ── Session control ──

  it('adds --resume when resumeSessionId is set', () => {
    const args = protocol.buildArgs({ resumeSessionId: 'sess-1' });
    expect(args).toContain('--resume');
    expect(args[args.indexOf('--resume') + 1]).toBe('sess-1');
  });

  it('adds --continue when continueSession is true', () => {
    const args = protocol.buildArgs({ continueSession: true });
    expect(args).toContain('--continue');
  });

  it('does not add --continue when continueSession is false', () => {
    const args = protocol.buildArgs({ continueSession: false });
    expect(args).not.toContain('--continue');
  });

  it('adds --fork-session as boolean flag (no value)', () => {
    const args = protocol.buildArgs({ forkSession: true });
    expect(args).toContain('--fork-session');
    // Next arg should NOT be a value for fork-session
    const idx = args.indexOf('--fork-session');
    expect(args[idx + 1]).not.toBe('true');
  });

  it('adds --session-id when sessionId is set', () => {
    const args = protocol.buildArgs({ sessionId: 'sid-1' });
    expect(args[args.indexOf('--session-id') + 1]).toBe('sid-1');
  });

  it('adds --resume-session-at', () => {
    const args = protocol.buildArgs({ resumeSessionAt: 'checkpoint-1' });
    expect(args[args.indexOf('--resume-session-at') + 1]).toBe('checkpoint-1');
  });

  it('adds --no-session-persistence when true', () => {
    const args = protocol.buildArgs({ noSessionPersistence: true });
    expect(args).toContain('--no-session-persistence');
  });

  // ── Model ──

  it('adds --model', () => {
    const args = protocol.buildArgs({ model: 'claude-opus-4-6' });
    expect(args[args.indexOf('--model') + 1]).toBe('claude-opus-4-6');
  });

  it('adds --fallback-model', () => {
    const args = protocol.buildArgs({ fallbackModel: 'claude-haiku-4-5-20251001' });
    expect(args[args.indexOf('--fallback-model') + 1]).toBe('claude-haiku-4-5-20251001');
  });

  // ── Thinking ──

  it('adds --thinking adaptive', () => {
    const args = protocol.buildArgs({ thinking: 'adaptive' });
    expect(args).toContain('--thinking');
    expect(args[args.indexOf('--thinking') + 1]).toBe('adaptive');
  });

  it('adds --thinking disabled', () => {
    const args = protocol.buildArgs({ thinking: 'disabled' });
    expect(args[args.indexOf('--thinking') + 1]).toBe('disabled');
  });

  it('adds --max-thinking-tokens for number (not --thinking)', () => {
    const args = protocol.buildArgs({ thinking: 8000 });
    expect(args).toContain('--max-thinking-tokens');
    expect(args[args.indexOf('--max-thinking-tokens') + 1]).toBe('8000');
    expect(args).not.toContain('--thinking');
  });

  // ── Effort & limits ──

  it('adds --effort', () => {
    const args = protocol.buildArgs({ effort: 'low' });
    expect(args[args.indexOf('--effort') + 1]).toBe('low');
  });

  it('adds --max-turns', () => {
    const args = protocol.buildArgs({ maxTurns: 10 });
    expect(args[args.indexOf('--max-turns') + 1]).toBe('10');
  });

  it('adds --max-budget-usd', () => {
    const args = protocol.buildArgs({ maxBudgetUsd: 5.5 });
    expect(args[args.indexOf('--max-budget-usd') + 1]).toBe('5.5');
  });

  // ── Agent ──

  it('adds --agent', () => {
    const args = protocol.buildArgs({ agent: 'my-agent' });
    expect(args[args.indexOf('--agent') + 1]).toBe('my-agent');
  });

  // ── Tools ──

  it('adds --allowedTools comma-separated', () => {
    const args = protocol.buildArgs({ allowedTools: ['Read', 'Write'] });
    expect(args[args.indexOf('--allowedTools') + 1]).toBe('Read,Write');
  });

  it('adds --disallowedTools comma-separated', () => {
    const args = protocol.buildArgs({ disallowedTools: ['Bash'] });
    expect(args[args.indexOf('--disallowedTools') + 1]).toBe('Bash');
  });

  it('adds --tools comma-separated', () => {
    const args = protocol.buildArgs({ tools: ['mcp:server1'] });
    expect(args[args.indexOf('--tools') + 1]).toBe('mcp:server1');
  });

  it('skips empty arrays', () => {
    const args = protocol.buildArgs({ allowedTools: [] });
    expect(args).not.toContain('--allowedTools');
  });

  // ── MCP ──

  it('adds --mcp-config with string path', () => {
    const args = protocol.buildArgs({ mcpConfig: '/path/to/config.json' });
    expect(args[args.indexOf('--mcp-config') + 1]).toBe('/path/to/config.json');
  });

  it('adds --mcp-config with object (JSON.stringify)', () => {
    const config = { servers: { test: { command: 'node' } } };
    const args = protocol.buildArgs({ mcpConfig: config });
    expect(args[args.indexOf('--mcp-config') + 1]).toBe(JSON.stringify(config));
  });

  it('adds --setting-sources comma-separated', () => {
    const args = protocol.buildArgs({ settingSources: ['user', 'project'] });
    expect(args[args.indexOf('--setting-sources') + 1]).toBe('user,project');
  });

  it('adds --strict-mcp-config when true', () => {
    const args = protocol.buildArgs({ strictMcpConfig: true });
    expect(args).toContain('--strict-mcp-config');
  });

  // ── Modes ──

  it('adds --permission-mode', () => {
    const args = protocol.buildArgs({ permissionMode: 'plan' });
    expect(args[args.indexOf('--permission-mode') + 1]).toBe('plan');
  });

  it('adds --proactive when true', () => {
    const args = protocol.buildArgs({ proactive: true });
    expect(args).toContain('--proactive');
  });

  it('does not add --proactive when false', () => {
    const args = protocol.buildArgs({ proactive: false });
    expect(args).not.toContain('--proactive');
  });

  it('adds --assistant when true', () => {
    const args = protocol.buildArgs({ assistant: true });
    expect(args).toContain('--assistant');
  });

  // ── Schema ──

  it('adds --json-schema as JSON string', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const args = protocol.buildArgs({ jsonSchema: schema });
    expect(args[args.indexOf('--json-schema') + 1]).toBe(JSON.stringify(schema));
  });

  // ── Betas ──

  it('adds --betas comma-separated', () => {
    const args = protocol.buildArgs({ betas: ['beta1', 'beta2'] });
    expect(args[args.indexOf('--betas') + 1]).toBe('beta1,beta2');
  });

  // ── Debug ──

  it('adds --debug when true', () => {
    const args = protocol.buildArgs({ debug: true });
    expect(args).toContain('--debug');
  });

  it('adds --debug-file', () => {
    const args = protocol.buildArgs({ debugFile: '/tmp/debug.log' });
    expect(args[args.indexOf('--debug-file') + 1]).toBe('/tmp/debug.log');
  });

  it('adds --debug-to-stderr when true', () => {
    const args = protocol.buildArgs({ debugToStderr: true });
    expect(args).toContain('--debug-to-stderr');
  });

  // ── Directories (repeatable) ──

  it('adds --add-dir for each directory', () => {
    const args = protocol.buildArgs({ addDirs: ['/path/a', '/path/b'] });
    const indices = args.reduce<number[]>(
      (acc, a, i) => (a === '--add-dir' ? [...acc, i] : acc),
      [],
    );
    expect(indices).toHaveLength(2);
    expect(args[indices[0] + 1]).toBe('/path/a');
    expect(args[indices[1] + 1]).toBe('/path/b');
  });

  it('adds --plugin-dir for each directory', () => {
    const args = protocol.buildArgs({ pluginDirs: ['/plugins/a'] });
    expect(args).toContain('--plugin-dir');
    expect(args[args.indexOf('--plugin-dir') + 1]).toBe('/plugins/a');
  });

  it('skips empty addDirs/pluginDirs', () => {
    const args = protocol.buildArgs({ addDirs: [], pluginDirs: [] });
    expect(args).not.toContain('--add-dir');
    expect(args).not.toContain('--plugin-dir');
  });

  // ── Combined ──

  it('combines multiple options', () => {
    const args = protocol.buildArgs({
      resumeSessionId: 'sess-1',
      model: 'opus',
      thinking: 'adaptive',
      effort: 'high',
      maxTurns: 5,
      proactive: true,
      debug: true,
      assistant: true,
      addDirs: ['/extra'],
    });
    expect(args).toContain('--resume');
    expect(args).toContain('--model');
    expect(args).toContain('--thinking');
    expect(args).toContain('--effort');
    expect(args).toContain('--max-turns');
    expect(args).toContain('--proactive');
    expect(args).toContain('--debug');
    expect(args).toContain('--assistant');
    expect(args).toContain('--add-dir');
  });
});

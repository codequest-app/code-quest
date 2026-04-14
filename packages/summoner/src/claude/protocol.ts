import { z } from 'zod';
import type { ParseResult } from '../types.ts';
import { isRecord } from '../utils.ts';
import type { LaunchOptions } from './launch-options.ts';
import { getSchemaForType, KNOWN_EVENT_TYPES, type ProtocolMessage } from './schemas.ts';

const initResponseSchema = z.looseObject({
  commands: z.array(z.object({ name: z.string() })).optional(),
  models: z.array(z.unknown()).optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});

// ── buildArgs helpers ──

function pushSessionFlags(args: string[], o: LaunchOptions): void {
  if (o.resumeSessionId) args.push('--resume', o.resumeSessionId);
  if (o.continueSession) args.push('--continue');
  if (o.forkSession) args.push('--fork-session');
  if (o.sessionId) args.push('--session-id', o.sessionId);
  if (o.resumeSessionAt) args.push('--resume-session-at', o.resumeSessionAt);
  if (o.noSessionPersistence) args.push('--no-session-persistence');
}

function pushModelFlags(args: string[], o: LaunchOptions): void {
  if (o.model) args.push('--model', o.model);
  if (o.fallbackModel) args.push('--fallback-model', o.fallbackModel);
  if (o.thinking != null) {
    if (typeof o.thinking === 'number') {
      args.push('--max-thinking-tokens', String(o.thinking));
    } else {
      args.push('--thinking', o.thinking);
    }
  }
  if (o.effort) args.push('--effort', o.effort);
  if (o.maxTurns != null) args.push('--max-turns', String(o.maxTurns));
  if (o.maxBudgetUsd != null) args.push('--max-budget-usd', String(o.maxBudgetUsd));
  if (o.agent) args.push('--agent', o.agent);
}

function pushToolFlags(args: string[], o: LaunchOptions): void {
  if (o.allowedTools?.length) args.push('--allowedTools', o.allowedTools.join(','));
  if (o.disallowedTools?.length) args.push('--disallowedTools', o.disallowedTools.join(','));
  if (o.tools?.length) args.push('--tools', o.tools.join(','));
}

function pushMcpFlags(args: string[], o: LaunchOptions): void {
  if (o.mcpConfig != null) {
    const configValue = typeof o.mcpConfig === 'string' ? o.mcpConfig : JSON.stringify(o.mcpConfig);
    args.push('--mcp-config', configValue);
  }
  if (o.settingSources?.length) args.push(`--setting-sources=${o.settingSources.join(',')}`);
  if (o.strictMcpConfig) args.push('--strict-mcp-config');
}

function pushMiscFlags(args: string[], o: LaunchOptions): void {
  if (o.allowDangerouslySkipPermissions) args.push('--allow-dangerously-skip-permissions');
  if (o.permissionMode) args.push('--permission-mode', o.permissionMode);
  if (o.proactive) args.push('--proactive');
  if (o.assistant) args.push('--assistant');
  if (o.jsonSchema) args.push('--json-schema', JSON.stringify(o.jsonSchema));
  if (o.betas?.length) args.push('--betas', o.betas.join(','));
  if (o.addDirs?.length) {
    for (const dir of o.addDirs) args.push('--add-dir', dir);
  }
  if (o.pluginDirs?.length) {
    for (const dir of o.pluginDirs) args.push('--plugin-dir', dir);
  }
  if (o.taskBudget) args.push('--task-budget', o.taskBudget.total.toString());
  if (o.channels?.length) args.push('--channels', ...o.channels);
  if (o.claudeInChromeMcp) args.push('--claude-in-chrome-mcp');
}

function pushDebugFlags(args: string[], o: LaunchOptions): void {
  if (o.debug) args.push('--debug');
  if (o.debugFile) args.push('--debug-file', o.debugFile);
  if (o.debugToStderr) args.push('--debug-to-stderr');
}

// ── ClaudeProtocol ──

export class ClaudeProtocol {
  readonly command = 'claude';

  readonly baseArgs = [
    '--output-format',
    'stream-json',
    '--input-format',
    'stream-json',
    '--verbose',
    '--permission-prompt-tool',
    'stdio',
    '--include-partial-messages',
    '--include-hook-events',
    // CLI echoes each user msg back via stdout with its JSONL uuid; required
    // for the client to learn the uuid for fork / rewind operations.
    '--replay-user-messages',
  ];

  buildArgs(options?: LaunchOptions): string[] {
    const args = [...this.baseArgs];
    if (!options) return args;

    pushSessionFlags(args, options);
    pushModelFlags(args, options);
    pushToolFlags(args, options);
    pushMcpFlags(args, options);
    pushMiscFlags(args, options);
    pushDebugFlags(args, options);

    return args;
  }

  /**
   * Parse a single line of CLI stdout JSON into a typed result.
   * Always returns a ParseResult — never null.
   */
  parseLine(line: string): ParseResult<ProtocolMessage> {
    const trimmed = line.trim();
    if (!trimmed) return { status: 'skip', raw: line, reason: 'empty' };

    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      return { status: 'skip', raw: line, reason: 'invalid_json' };
    }

    if (!isRecord(json) || !('type' in json)) {
      return { status: 'skip', raw: trimmed, reason: 'no_type' };
    }
    const obj = json;
    const type = typeof obj.type === 'string' ? obj.type : '';

    if (type === 'keep_alive') return { status: 'skip', raw: trimmed, reason: 'keep_alive' };

    // Unknown type
    if (!KNOWN_EVENT_TYPES.has(type)) {
      return { status: 'unknown', raw: trimmed, type, data: obj };
    }

    // Look up schema (system events use subtype for dispatch)
    const subtype = type === 'system' && typeof obj.subtype === 'string' ? obj.subtype : undefined;
    const schema = getSchemaForType(type, subtype);
    if (!schema) {
      return { status: 'unknown', raw: trimmed, type, data: obj };
    }

    const result = schema.safeParse(obj);
    if (!result.success) {
      return { status: 'error', raw: trimmed, error: result.error };
    }

    return { status: 'ok', raw: trimmed, message: result.data as ProtocolMessage };
  }

  /**
   * Format a user message for CLI stdin.
   */
  formatUserMessage(text: string): string {
    return JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text }],
      },
    });
  }

  /**
   * Format a control response for CLI stdin.
   */
  formatControlResponse(requestId: string, response: Record<string, unknown>): string {
    return JSON.stringify({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: requestId,
        response,
      },
    });
  }

  /**
   * Format a control request for CLI stdin.
   */
  formatControlRequest(
    subtype: string,
    input?: Record<string, unknown>,
    requestId?: string,
  ): string {
    return JSON.stringify({
      request_id: requestId ?? crypto.randomUUID(),
      type: 'control_request',
      request: {
        subtype,
        ...input,
      },
    });
  }

  /**
   * Parse the CLI initialize control_response to extract commands, models, and account.
   */
  parseInitializeResponse(response: Record<string, unknown> | undefined): {
    commands: string[] | undefined;
    models: unknown[] | undefined;
    account: Record<string, unknown> | undefined;
  } {
    if (!response) return { commands: undefined, models: undefined, account: undefined };

    const parsed = initResponseSchema.safeParse(response);
    if (!parsed.success) return { commands: undefined, models: undefined, account: undefined };

    const commands = parsed.data.commands?.map((c) => c.name);
    return { commands, models: parsed.data.models, account: parsed.data.account };
  }
}

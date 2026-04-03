import type { ParseResult } from '../types.ts';
import type { LaunchOptions } from './launch-options.ts';
import { getSchemaForType, KNOWN_EVENT_TYPES, type ProtocolEvent } from './schemas.ts';

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
  ];

  buildArgs(options?: LaunchOptions): string[] {
    const args = [...this.baseArgs];
    if (!options) return args;

    // Session control
    if (options.resumeSessionId) args.push('--resume', options.resumeSessionId);
    if (options.continueSession) args.push('--continue');
    if (options.forkSession) args.push('--fork-session');
    if (options.sessionId) args.push('--session-id', options.sessionId);
    if (options.resumeSessionAt) args.push('--resume-session-at', options.resumeSessionAt);
    if (options.noSessionPersistence) args.push('--no-session-persistence');

    // Model
    if (options.model) args.push('--model', options.model);
    if (options.fallbackModel) args.push('--fallback-model', options.fallbackModel);

    // Thinking & effort
    if (options.thinking != null) {
      if (typeof options.thinking === 'number') {
        args.push('--max-thinking-tokens', String(options.thinking));
      } else {
        args.push('--thinking', options.thinking);
      }
    }
    if (options.effort) args.push('--effort', options.effort);

    // Limits
    if (options.maxTurns != null) args.push('--max-turns', String(options.maxTurns));
    if (options.maxBudgetUsd != null) args.push('--max-budget-usd', String(options.maxBudgetUsd));

    // Agent
    if (options.agent) args.push('--agent', options.agent);

    // Tools
    if (options.allowedTools?.length) args.push('--allowedTools', options.allowedTools.join(','));
    if (options.disallowedTools?.length)
      args.push('--disallowedTools', options.disallowedTools.join(','));
    if (options.tools?.length) args.push('--tools', options.tools.join(','));

    // MCP
    if (options.mcpConfig != null) {
      const configValue =
        typeof options.mcpConfig === 'string'
          ? options.mcpConfig
          : JSON.stringify(options.mcpConfig);
      args.push('--mcp-config', configValue);
    }
    if (options.settingSources?.length)
      args.push(`--setting-sources=${options.settingSources.join(',')}`);
    if (options.strictMcpConfig) args.push('--strict-mcp-config');

    // Permissions
    if (options.allowDangerouslySkipPermissions) args.push('--allow-dangerously-skip-permissions');

    // Modes
    if (options.permissionMode) args.push('--permission-mode', options.permissionMode);
    if (options.proactive) args.push('--proactive');
    if (options.assistant) args.push('--assistant');

    // Schema
    if (options.jsonSchema) args.push('--json-schema', JSON.stringify(options.jsonSchema));

    // Betas
    if (options.betas?.length) args.push('--betas', options.betas.join(','));

    // Debug
    if (options.debug) args.push('--debug');
    if (options.debugFile) args.push('--debug-file', options.debugFile);
    if (options.debugToStderr) args.push('--debug-to-stderr');

    // Directories (repeatable)
    if (options.addDirs?.length) {
      for (const dir of options.addDirs) args.push('--add-dir', dir);
    }
    if (options.pluginDirs?.length) {
      for (const dir of options.pluginDirs) args.push('--plugin-dir', dir);
    }
    if (options.taskBudget) {
      args.push('--task-budget', options.taskBudget.total.toString());
    }
    if (options.channels?.length) {
      args.push('--channels', ...options.channels);
    }
    if (options.claudeInChromeMcp) {
      args.push('--claude-in-chrome-mcp');
    }

    return args;
  }

  /**
   * Parse a single line of CLI stdout JSON into a typed result.
   * Always returns a ParseResult — never null.
   */
  parseLine(line: string): ParseResult<ProtocolEvent> {
    const trimmed = line.trim();
    if (!trimmed) return { status: 'skip', raw: line, reason: 'empty' };

    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      return { status: 'skip', raw: line, reason: 'invalid_json' };
    }

    if (typeof json !== 'object' || json === null || !('type' in json)) {
      return { status: 'skip', raw: trimmed, reason: 'no_type' };
    }
    const obj = json as Record<string, unknown>;
    const type = obj.type as string;

    if (type === 'keep_alive') return { status: 'skip', raw: trimmed, reason: 'keep_alive' };

    // Unknown type
    if (!KNOWN_EVENT_TYPES.has(type)) {
      return { status: 'unknown', raw: trimmed, type, data: obj };
    }

    // Look up schema (system events use subtype for dispatch)
    const subtype = type === 'system' ? (obj.subtype as string | undefined) : undefined;
    const schema = getSchemaForType(type, subtype);
    if (!schema) {
      return { status: 'unknown', raw: trimmed, type, data: obj };
    }

    const result = schema.safeParse(obj);
    if (!result.success) {
      return { status: 'error', raw: trimmed, error: result.error };
    }

    return { status: 'ok', raw: trimmed, event: result.data as ProtocolEvent };
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

    const commands = Array.isArray(response.commands)
      ? (response.commands as Array<{ name: string }>).map((c) => c.name)
      : undefined;

    const models = Array.isArray(response.models) ? (response.models as unknown[]) : undefined;

    const account =
      typeof response.account === 'object' && response.account !== null
        ? (response.account as Record<string, unknown>)
        : undefined;

    return { commands, models, account };
  }
}

import { type ProviderClientConfig, providerClientConfigSchema } from '@code-quest/shared';
import type {
  AdapterOutput,
  ClientMessage,
  ParseResult,
  ProviderAdapter,
  ResolvedControlResponse,
} from '../types.ts';
import { isRecord } from '../utils.ts';
import type { LaunchOptions } from './launch-options.ts';
import { ClaudeProtocol } from './protocol.ts';
import type { ProtocolMessage } from './schemas.ts';
import { transformAssistant } from './transforms/assistant.ts';
import { transformControlRequest } from './transforms/control.ts';
import { transformResult } from './transforms/result.ts';
import { transformStream } from './transforms/stream.ts';
import { transformSystem } from './transforms/system.ts';
import { transformUser } from './transforms/user.ts';

interface ConvertResult {
  messages: ClientMessage[];
  serverActions: never[];
  controlResponses: ResolvedControlResponse[];
}

const EMPTY: ConvertResult = { messages: [], serverActions: [], controlResponses: [] };

interface RequestMapping {
  subtype: string;
  mapPayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
}

const serverNamePayload = (p: Record<string, unknown>) => {
  const { serverName, ...rest } = p;
  return { server_name: serverName, ...rest };
};

const REQUEST_MAPPINGS: Record<string, RequestMapping> = {
  // settings
  'settings:set_model': { subtype: 'set_model' },
  'settings:set_permission_mode': { subtype: 'set_permission_mode' },
  'settings:set_thinking_level': { subtype: 'set_max_thinking_tokens' },
  'settings:set_proactive': { subtype: 'set_proactive' },
  'settings:remote_control': { subtype: 'remote_control' },
  'settings:apply': { subtype: 'apply_flag_settings' },
  'settings:get_context_usage': { subtype: 'get_context_usage' },
  // message
  'message:interrupt': { subtype: 'interrupt' },
  'message:stop_task': { subtype: 'stop_task' },
  'message:cancel_async': { subtype: 'cancel_async_message' },
  'message:rewind': { subtype: 'rewind_files' },
  // session
  'session:generate_title': { subtype: 'generate_session_title' },
  'session:initialize': { subtype: 'initialize' },
  // mcp
  'mcp:reconnect': { subtype: 'mcp_reconnect', mapPayload: serverNamePayload },
  'mcp:toggle': { subtype: 'mcp_toggle', mapPayload: serverNamePayload },
  'mcp:servers': { subtype: 'mcp_status' },
  'mcp:set_servers': { subtype: 'mcp_set_servers' },
  'mcp:message': { subtype: 'mcp_message', mapPayload: serverNamePayload },
  'mcp:authenticate': { subtype: 'mcp_authenticate', mapPayload: serverNamePayload },
  'mcp:clear_auth': { subtype: 'mcp_clear_auth', mapPayload: serverNamePayload },
  // claude-specific auth
  'auth:authenticate': { subtype: 'claude_authenticate' },
  'auth:oauth_callback': { subtype: 'claude_oauth_callback' },
  'auth:oauth_wait': { subtype: 'claude_oauth_wait_for_completion' },
  'mcp:oauth_callback': {
    subtype: 'mcp_oauth_callback_url',
    mapPayload: (p) => {
      const { serverName, callbackUrl, ...rest } = p;
      return { server_name: serverName, callback_url: callbackUrl, ...rest };
    },
  },
};

function convertRateLimitMessage(message: ProtocolMessage): ClientMessage {
  // rate_limit_info exists on the rateLimitEvent variant — narrowing done by caller's switch
  const rli = message.rate_limit_info as Record<string, unknown>;
  return {
    name: 'system:rate_limit',
    payload: {
      info: {
        status: rli.status ?? '',
        rateLimitType: rli.rateLimitType,
        resetsAt: rli.resetsAt != null ? String(rli.resetsAt) : undefined,
        utilization: rli.utilization != null ? rli.utilization : undefined,
        overageStatus: rli.overageStatus,
        isUsingOverage: rli.isUsingOverage,
      },
    },
  };
}

function convertAuthStatusMessage(message: ProtocolMessage): ClientMessage {
  return {
    name: 'notification:auth_status',
    payload: {
      status: message.isAuthenticating ? 'authenticating' : 'authenticated',
      output: Array.isArray(message.output) ? message.output.join('\n') : undefined,
      account: message.account,
    },
  };
}

export class ClaudeAdapter implements ProviderAdapter<ProtocolMessage, LaunchOptions> {
  private readonly protocol = new ClaudeProtocol();

  readonly clientConfig: ProviderClientConfig = providerClientConfigSchema.parse({
    brand: {
      name: 'Claude',
      company: 'Anthropic',
      docsUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview',
      placeholder: '⌘ Esc to focus or unfocus Claude',
      loginTitle: 'Login to Claude',
    },
    permissionModes: [
      {
        id: 'normal',
        label: 'Ask before edits',
        description: 'Claude will ask for approval before making each edit',
      },
      {
        id: 'acceptEdits',
        label: 'Edit automatically',
        description: 'Claude will edit your selected text or the whole file',
      },
      {
        id: 'plan',
        label: 'Plan mode',
        description: 'Claude will explore the code and present a plan before editing',
      },
      {
        id: 'bypassPermissions',
        label: 'Bypass permissions',
        description:
          'Claude will not ask for approval before running potentially dangerous commands',
      },
    ],
    authMethods: [
      { id: 'claudeai', label: 'Claude AI' },
      { id: 'console', label: 'Anthropic Console' },
      { id: 'api-key', label: 'API Key' },
      { id: '3p', label: 'Third Party' },
      { id: 'not-specified', label: 'Not Specified' },
    ],
    mcpScopes: [
      { id: 'project', label: 'Project' },
      { id: 'local', label: 'Local' },
      { id: 'user', label: 'User' },
      { id: 'claudeai', label: 'claude.ai', prefix: 'claude.ai ' },
      { id: 'managed', label: 'Managed' },
      { id: 'enterprise', label: 'Enterprise' },
    ],
    usageTiers: [
      { key: 'five_hour', label: 'Session (5hr)', shortLabel: '5hr' },
      { key: 'seven_day', label: 'Weekly (7 day)', shortLabel: '7day' },
      { key: 'seven_day_sonnet', label: 'Weekly Sonnet', shortLabel: 'Sonnet' },
    ],
    defaultModels: [
      {
        value: 'default',
        displayName: 'Default (recommended)',
        description: 'Opus 4.6 · Most capable for complex work',
        supportsEffort: true,
        supportedEffortLevels: ['low', 'medium', 'high', 'max'],
        supportsAdaptiveThinking: true,
        supportsFastMode: true,
      },
      {
        value: 'sonnet',
        displayName: 'Sonnet',
        description: 'Sonnet 4.6 · Best for everyday tasks',
        supportsEffort: true,
        supportedEffortLevels: ['low', 'medium', 'high', 'max'],
        supportsAdaptiveThinking: true,
      },
      {
        value: 'haiku',
        displayName: 'Haiku',
        description: 'Haiku 4.5 · Fastest for quick answers',
      },
    ],
    defaultModelDescription: 'Most capable for complex work',
  });

  get command(): string {
    return this.protocol.command;
  }

  buildArgs(options?: LaunchOptions): string[] {
    return this.protocol.buildArgs(options);
  }

  parseLine(line: string): ParseResult<ProtocolMessage> {
    return this.protocol.parseLine(line);
  }

  transform(message: ProtocolMessage): AdapterOutput {
    const { messages, serverActions, controlResponses } = this.convertMessage(message);
    return { messages, controlResponses, serverActions };
  }

  formatRequest(
    event: string,
    payload: Record<string, unknown>,
  ): { subtype: string; input: Record<string, unknown> } {
    const mapping = REQUEST_MAPPINGS[event];
    if (!mapping) throw new Error(`Unknown request event: ${event}`);
    const input = mapping.mapPayload ? mapping.mapPayload(payload) : payload;
    return { subtype: mapping.subtype, input };
  }

  formatMessage(text: string): string {
    return this.protocol.formatUserMessage(text);
  }

  formatControlRequest(
    subtype: string,
    input?: Record<string, unknown>,
    requestId?: string,
  ): string {
    return this.protocol.formatControlRequest(subtype, input, requestId);
  }

  formatControlResponse(requestId: string, response: Record<string, unknown>): string {
    return this.protocol.formatControlResponse(requestId, response);
  }

  extractRespondedRequestIds(rawEntries: Array<{ direction: string; raw: string }>): Set<string> {
    const ids = new Set<string>();
    for (const entry of rawEntries) {
      if (entry.direction !== 'in') continue;
      try {
        const obj = JSON.parse(entry.raw.trim());
        if (!isRecord(obj)) continue;
        const resp = isRecord(obj.response) ? obj.response : undefined;
        if (typeof resp?.request_id === 'string') ids.add(resp.request_id);
      } catch {
        // ignore
      }
    }
    return ids;
  }

  // ── Core dispatch ──

  private convertMessage(message: ProtocolMessage): ConvertResult {
    if (message.type === 'keep_alive') return EMPTY;

    if (message.type === 'control_response') {
      const resp = message.response;
      return {
        messages: [],
        serverActions: [],
        controlResponses: [
          {
            requestId: resp.request_id,
            success: resp.subtype === 'success',
            response: resp.response,
            error: resp.error,
          },
        ],
      };
    }

    if (message.type === 'control_cancel_request') {
      return {
        messages: [{ name: 'control:cancel', payload: { requestId: message.request_id } }],
        serverActions: [],
        controlResponses: [],
      };
    }

    if (message.type === 'control_request') {
      return transformControlRequest(message);
    }

    // All other types produce only ClientMessages
    const result = this.convertOtherMessage(message);
    if (result === null) return EMPTY;
    const messages = Array.isArray(result) ? result : [result];
    return { messages, serverActions: [], controlResponses: [] };
  }

  // ── Non-control messages → ClientMessage ──

  private convertOtherMessage(message: ProtocolMessage): ClientMessage | ClientMessage[] | null {
    switch (message.type) {
      case 'system':
        return transformSystem(message);
      case 'assistant':
        return transformAssistant(message);
      case 'user':
        return transformUser(message);
      case 'result':
        return transformResult(message);
      case 'stream_event':
        return transformStream(message);
      case 'rate_limit_event':
        return convertRateLimitMessage(message);
      case 'speech_to_text_message':
        return {
          name: 'speech:message',
          payload: { channelId: message.channelId, text: message.text, done: message.done },
        };
      case 'streamlined_text':
        return { name: 'stream:text', payload: { text: message.text } };
      case 'streamlined_tool_use_summary':
        return { name: 'stream:tool_summary', payload: { toolSummary: message.tool_summary } };
      case 'error':
        return {
          name: 'error:message',
          payload: { message: message.error?.message ?? 'Unknown error' },
        };
      case 'experiment_gates':
        return { name: 'app:experiment_gates', payload: { gates: message.gates } };
      case 'available_models':
        return { name: 'app:models', payload: { models: message.models } };
      case 'notification':
        return { name: 'notification:toast', payload: { message: message.message } };
      case 'auth_status':
        return convertAuthStatusMessage(message);
      case 'auth_url':
        return {
          name: 'notification:auth_url',
          payload: { url: message.url, method: message.method ?? 'oauth' },
        };
      default: {
        const raw = message as Record<string, unknown>;
        if (typeof raw.rawType === 'string' && isRecord(raw.data)) {
          return { name: 'raw:event', payload: { rawType: raw.rawType, data: raw.data } };
        }
        return { name: 'raw:event', payload: { rawType: message.type, data: raw } };
      }
    }
  }
}

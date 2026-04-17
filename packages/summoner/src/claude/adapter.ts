import type { ProviderClientConfig } from '@code-quest/shared';
import type { z } from 'zod';
import type {
  AdapterOutput,
  ClientMessage,
  ParseResult,
  ProviderAdapter,
  ResolvedControlResponse,
} from '../types.ts';
import { isRecord } from '../utils.ts';
import { claudeClientConfig } from './client-config.ts';
import type { LaunchOptions } from './launch-options.ts';
import { ClaudeProtocol } from './protocol.ts';
import type { ProtocolMessage, rateLimitEventSchema } from './schemas.ts';
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
  mapResponse?: (response: Record<string, unknown>) => Record<string, unknown>;
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
  'message:side_question': { subtype: 'side_question' },
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
  // transcript
  'transcript:seed_read_state': { subtype: 'seed_read_state' },
  // mcp channel
  'mcp:channel_enable': { subtype: 'channel_enable', mapPayload: serverNamePayload },
  // plugin
  'plugin:reload': { subtype: 'reload_plugins', mapResponse: (r) => ({ data: r }) },
  // ultrareview
  'ultrareview:launch': { subtype: 'ultrareview_launch' },
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

type RateLimitEvent = z.infer<typeof rateLimitEventSchema>;

function convertRateLimitMessage(message: RateLimitEvent): ClientMessage {
  const rli = message.rate_limit_info;
  return {
    name: 'system:rate_limit',
    payload: {
      info: {
        status: rli.status ?? '',
        rateLimitType: rli.rateLimitType,
        resetsAt: rli.resetsAt != null ? String(rli.resetsAt) : undefined,
        utilization: typeof rli.utilization === 'number' ? rli.utilization : undefined,
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
      account: isRecord(message.account) ? message.account : undefined,
    },
  };
}

export class ClaudeAdapter implements ProviderAdapter<ProtocolMessage, LaunchOptions> {
  private readonly protocol = new ClaudeProtocol();

  readonly clientConfig: ProviderClientConfig = claudeClientConfig;

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

  mapResponse(event: string, response: Record<string, unknown>): Record<string, unknown> {
    const mapping = REQUEST_MAPPINGS[event];
    return mapping?.mapResponse ? mapping.mapResponse(response) : {};
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
      } catch (error) {
        // summoner is a standalone package with no pino dependency; keep console.debug
        // for best-effort diagnostics while scanning possibly-malformed raw entries.
        console.debug('Failed to parse JSON', error);
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
    const transformer = OTHER_MESSAGE_TRANSFORMERS[message.type];
    if (transformer) return transformer(message);
    // Any other unknown ProtocolMessage variant — spread to raw payload.
    const data: Record<string, unknown> = { ...message };
    return { name: 'raw:event', payload: { rawType: message.type, data } };
  }
}

type OtherTransformer = (m: ProtocolMessage) => ClientMessage | ClientMessage[] | null;

const OTHER_MESSAGE_TRANSFORMERS: Record<string, OtherTransformer> = {
  system: (m) => transformSystem(m as Extract<ProtocolMessage, { type: 'system' }>),
  assistant: (m) => transformAssistant(m as Extract<ProtocolMessage, { type: 'assistant' }>),
  user: (m) => transformUser(m as Extract<ProtocolMessage, { type: 'user' }>),
  result: (m) => transformResult(m as Extract<ProtocolMessage, { type: 'result' }>),
  stream_event: (m) => transformStream(m as Extract<ProtocolMessage, { type: 'stream_event' }>),
  rate_limit_event: (m) =>
    convertRateLimitMessage(m as Extract<ProtocolMessage, { type: 'rate_limit_event' }>),
  speech_to_text_message: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'speech_to_text_message' }>;
    return { name: 'speech:message', payload: { text: msg.text, done: msg.done } };
  },
  streamlined_text: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'streamlined_text' }>;
    return { name: 'stream:text', payload: { text: msg.text } };
  },
  streamlined_tool_use_summary: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'streamlined_tool_use_summary' }>;
    return { name: 'stream:tool_summary', payload: { toolSummary: msg.tool_summary } };
  },
  error: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'error' }>;
    return {
      name: 'error:message',
      payload: { message: msg.error?.message ?? 'Unknown error' },
    };
  },
  experiment_gates: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'experiment_gates' }>;
    const gates: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(msg.gates)) {
      gates[k] = Boolean(v);
    }
    return { name: 'app:experiment_gates', payload: { gates } };
  },
  available_models: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'available_models' }>;
    return { name: 'app:models', payload: { models: msg.models } };
  },
  notification: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'notification' }>;
    return { name: 'notification:toast', payload: { message: msg.message } };
  },
  auth_status: (m) => convertAuthStatusMessage(m),
  auth_url: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'auth_url' }>;
    return {
      name: 'notification:auth_url',
      payload: { url: msg.url, method: msg.method ?? 'oauth' },
    };
  },
  raw_event: (m) => {
    const msg = m as Extract<ProtocolMessage, { type: 'raw_event' }>;
    return { name: 'raw:event', payload: { rawType: msg.rawType, data: msg.data } };
  },
};

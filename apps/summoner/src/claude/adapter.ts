import type { ClientMessage, ProviderClientConfig } from '@code-quest/shared';
import type { AdapterOutput, ParseResult, ProviderAdapter } from '../types.ts';
import { isRecord } from '../utils.ts';
import { claudeClientConfig } from './client-config.ts';
import type { LaunchOptions } from './launch-options.ts';
import { ClaudeProtocol } from './protocol.ts';
import type { ProtocolMessage } from './schemas.ts';
import { transformAvailableModels, transformExperimentGates } from './transforms/app.ts';
import { transformAssistant } from './transforms/assistant.ts';
import { transformAuthStatus, transformAuthUrl } from './transforms/auth.ts';
import { transformControlRequest } from './transforms/control.ts';
import { transformError, transformNotification, transformSpeechToText } from './transforms/misc.ts';
import { transformRateLimit } from './transforms/rate-limit.ts';
import { transformResult } from './transforms/result.ts';
import {
  transformStream,
  transformStreamlinedText,
  transformStreamlinedToolUseSummary,
} from './transforms/stream.ts';
import { transformSystem } from './transforms/system.ts';
import { transformUser } from './transforms/user.ts';

const EMPTY: AdapterOutput = { messages: [], controlResponses: [] };

interface RequestMapping {
  subtype: string;
  mapPayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
  mapResponse?: (response: Record<string, unknown>) => Record<string, unknown>;
}

const serverNamePayload = (p: Record<string, unknown>) => {
  const { serverName, ...rest } = p;
  return { server_name: serverName, ...rest };
};

const oauthCallbackPayload = (p: Record<string, unknown>) => {
  const { callbackUrl, ...rest } = p;
  return { ...serverNamePayload(rest), callback_url: callbackUrl };
};

const wrapInData = (r: Record<string, unknown>) => ({ data: r });

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
  'plugin:reload': { subtype: 'reload_plugins', mapResponse: wrapInData },
  // ultrareview
  'ultrareview:launch': { subtype: 'ultrareview_launch' },
  // claude-specific auth
  'auth:authenticate': { subtype: 'claude_authenticate' },
  'auth:oauth_callback': { subtype: 'claude_oauth_callback' },
  'auth:oauth_wait': { subtype: 'claude_oauth_wait_for_completion' },
  'mcp:oauth_callback': {
    subtype: 'mcp_oauth_callback_url',
    mapPayload: oauthCallbackPayload,
  },
};

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
    return this.convertMessage(message);
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

  extractRespondedRequestIds(
    parsedEvents: Array<{ direction: string; obj: Record<string, unknown> }>,
  ): Set<string> {
    const ids = new Set<string>();
    for (const event of parsedEvents) {
      if (event.direction !== 'in') continue;
      const resp = isRecord(event.obj.response) ? event.obj.response : undefined;
      if (typeof resp?.request_id === 'string') ids.add(resp.request_id);
    }
    return ids;
  }

  // ── Core dispatch ──

  private convertMessage(message: ProtocolMessage): AdapterOutput {
    if (message.type === 'keep_alive') return EMPTY;

    if (message.type === 'control_response') {
      const resp = message.response;
      return {
        messages: [],
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
    return { messages, controlResponses: [] };
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
type MessageByType<T extends ProtocolMessage['type']> = Extract<ProtocolMessage, { type: T }>;

/** Register a typed handler for a ProtocolMessage discriminant. The `as`
 *  cast is contained here (single place) so call sites below read as
 *  type-narrowed functions over the concrete variant. */
function handler<T extends ProtocolMessage['type']>(
  key: T,
  fn: (m: MessageByType<T>) => ClientMessage | ClientMessage[] | null,
): [T, OtherTransformer] {
  return [key, (m) => fn(m as MessageByType<T>)];
}

const OTHER_MESSAGE_TRANSFORMERS: Record<string, OtherTransformer> = Object.fromEntries([
  handler('system', transformSystem),
  handler('assistant', transformAssistant),
  handler('user', transformUser),
  handler('result', transformResult),
  handler('stream_event', transformStream),
  handler('rate_limit_event', transformRateLimit),
  handler('speech_to_text_message', transformSpeechToText),
  handler('streamlined_text', transformStreamlinedText),
  handler('streamlined_tool_use_summary', transformStreamlinedToolUseSummary),
  handler('error', transformError),
  handler('experiment_gates', transformExperimentGates),
  handler('available_models', transformAvailableModels),
  handler('notification', transformNotification),
  handler('auth_status', transformAuthStatus),
  handler('auth_url', transformAuthUrl),
  handler('raw_event', (msg) => ({
    name: 'raw:event',
    payload: { rawType: msg.rawType, data: msg.data },
  })),
]);

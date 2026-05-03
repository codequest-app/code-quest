import type { ProviderClientConfig } from '@code-quest/shared';
import type { AdapterOutput, ClientMessage, ParseResult, ProviderAdapter } from '../types.ts';
import { isRecord } from '../utils.ts';
import { claudeClientConfig } from './client-config.ts';
import type { LaunchOptions } from './launch-options.ts';
import { ClaudeProtocol } from './protocol.ts';
import { requestMappings } from './request-mappings.ts';
import type { ProtocolMessage } from './schemas.ts';
import { transformAssistant } from './transforms/assistant.ts';
import { transformAuthStatus } from './transforms/auth.ts';
import { transformControlRequest } from './transforms/control.ts';
import { transformRateLimit } from './transforms/notification.ts';
import { transformResult } from './transforms/result.ts';
import { transformStream } from './transforms/stream.ts';
import { transformSystem } from './transforms/system.ts';
import { transformUser } from './transforms/user.ts';

const EMPTY: AdapterOutput = { messages: [], controlResponses: [] };

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
    const mapping = requestMappings[event];
    if (!mapping) throw new Error(`Unknown request event: ${event}`);
    const input = mapping.mapPayload ? mapping.mapPayload(payload) : payload;
    return { subtype: mapping.subtype, input };
  }

  mapResponse(event: string, response: Record<string, unknown>): Record<string, unknown> {
    const mapping = requestMappings[event];
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
  handler('speech_to_text_message', (msg) => ({
    name: 'speech:message',
    payload: { text: msg.text, done: msg.done },
  })),
  handler('streamlined_text', (msg) => ({
    name: 'stream:text',
    payload: { text: msg.text },
  })),
  handler('streamlined_tool_use_summary', (msg) => ({
    name: 'stream:tool_summary',
    payload: { toolSummary: msg.tool_summary },
  })),
  handler('error', (msg) => ({
    name: 'error:message',
    payload: { message: msg.error?.message ?? 'Unknown error' },
  })),
  handler('experiment_gates', (msg) => {
    const gates: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(msg.gates)) {
      gates[k] = Boolean(v);
    }
    return { name: 'app:experiment_gates', payload: { gates } };
  }),
  handler('available_models', (msg) => ({
    name: 'app:models',
    payload: { models: msg.models },
  })),
  handler('notification', (msg) => ({
    name: 'notification:toast',
    payload: { message: msg.message },
  })),
  handler('auth_status', transformAuthStatus),
  handler('auth_url', (msg) => ({
    name: 'notification:auth_url',
    payload: { url: msg.url, method: msg.method ?? 'oauth' },
  })),
  handler('raw_event', (msg) => ({
    name: 'raw:event',
    payload: { rawType: msg.rawType, data: msg.data },
  })),
]);

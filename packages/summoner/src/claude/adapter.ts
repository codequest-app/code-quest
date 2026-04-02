import {
  type ContentBlock,
  type ProviderClientConfig,
  providerClientConfigSchema,
} from '@code-quest/shared';
import type {
  AdapterOutput,
  ControlResponseEvent,
  ParseResult,
  ProviderAdapter,
  SocketEvent,
} from '../types.ts';
import type { LaunchOptions } from './launch-options.ts';
import { ClaudeProtocol } from './protocol.ts';
import type { ProtocolEvent } from './schemas.ts';
import { transformAssistantEvent } from './transforms/assistant.ts';
import { transformControlRequest } from './transforms/control.ts';
import { transformResultEvent } from './transforms/result.ts';
import { transformStreamEvent } from './transforms/stream.ts';
import { transformSystemEvent } from './transforms/system.ts';
import { transformUserEvent } from './transforms/user.ts';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

interface ConvertResult {
  events: SocketEvent[];
  serverActions: never[];
  controlResponses: ControlResponseEvent[];
}

const EMPTY: ConvertResult = { events: [], serverActions: [], controlResponses: [] };

export class ClaudeAdapter implements ProviderAdapter<ProtocolEvent, LaunchOptions> {
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

  parseLine(line: string): ParseResult<ProtocolEvent> {
    return this.protocol.parseLine(line);
  }

  transform(event: ProtocolEvent): AdapterOutput {
    const { events, serverActions, controlResponses } = this.convertEvent(event);
    return { events, controlResponses, serverActions };
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

  private convertEvent(event: ProtocolEvent): ConvertResult {
    if (event.type === 'keep_alive') return EMPTY;

    if (event.type === 'control_response') {
      const resp = event.response;
      return {
        events: [],
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

    if (event.type === 'control_cancel_request') {
      return {
        events: [{ name: 'control:cancel', payload: { requestId: event.request_id } }],
        serverActions: [],
        controlResponses: [],
      };
    }

    if (event.type === 'control_request') {
      return transformControlRequest(event as Record<string, unknown>);
    }

    // All other types produce only SocketEvents
    const se = this.convertOtherEvent(event);
    if (se === null) return EMPTY;
    const events = Array.isArray(se) ? se : [se];
    return { events, serverActions: [], controlResponses: [] };
  }

  // ── Non-control events → SocketEvent ──

  private convertOtherEvent(event: ProtocolEvent): SocketEvent | SocketEvent[] | null {
    if (event.type === 'system') return transformSystemEvent(event as Record<string, unknown>);
    const e = event as Record<string, unknown>;
    if (event.type === 'assistant') return transformAssistantEvent(e);
    if (event.type === 'user') return transformUserEvent(e);
    if (event.type === 'result') return transformResultEvent(e);
    if (event.type === 'stream_event') return transformStreamEvent(e);

    if (event.type === 'rate_limit_event') {
      const rli = event.rate_limit_info;
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

    if (event.type === 'speech_to_text_message') {
      return {
        name: 'speech:message',
        payload: { channelId: event.channelId, text: event.text, done: event.done },
      };
    }

    if (event.type === 'streamlined_text') {
      return { name: 'stream:text', payload: { text: event.text } };
    }

    if (event.type === 'streamlined_tool_use_summary') {
      return { name: 'stream:tool_summary', payload: { toolSummary: event.tool_summary } };
    }

    if (event.type === 'error') {
      return {
        name: 'error:message',
        payload: { message: event.error?.message ?? 'Unknown error' },
      };
    }

    if (event.type === 'experiment_gates') {
      return { name: 'app:experiment_gates', payload: { gates: event.gates } };
    }

    if (event.type === 'available_models') {
      return { name: 'app:models', payload: { models: event.models } };
    }

    if (event.type === 'notification') {
      return { name: 'notification:toast', payload: { message: event.message } };
    }

    if (event.type === 'auth_status') {
      return {
        name: 'notification:auth_status',
        payload: {
          status: event.isAuthenticating ? 'authenticating' : 'authenticated',
          output: Array.isArray(event.output) ? event.output.join('\n') : undefined,
          account: event.account,
        },
      };
    }

    if (event.type === 'auth_url') {
      return {
        name: 'notification:auth_url',
        payload: { url: event.url, method: event.method ?? 'oauth' },
      };
    }

    // Unknown/unhandled → raw:event
    const data = event as unknown as Record<string, unknown>;
    if (typeof data.rawType === 'string' && isRecord(data.data)) {
      return { name: 'raw:event', payload: { rawType: data.rawType, data: data.data } };
    }
    return { name: 'raw:event', payload: { rawType: event.type, data } };
  }
}

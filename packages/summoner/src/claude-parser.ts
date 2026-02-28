import {
  cliAssistantSchema,
  cliControlRequestSchema,
  cliControlResponseSchema,
  cliResultSchema,
  cliSystemInitSchema,
} from './schemas.ts';
import type { ChatStats, ChatStreamEvent } from './types.ts';

const IGNORED_TYPES = new Set([
  'rate_limit_event',
  'keep_alive',
  'streamlined_text',
  'streamlined_tool_use_summary',
]);

const IGNORED_SYSTEM_SUBTYPES = new Set(['hook_started', 'hook_response']);

export class ClaudeParser {
  /** Maps toolUseId → toolName for resolving tool_result names */
  private toolNameMap = new Map<string, string>();

  parseLine(line: string): ChatStreamEvent[] {
    const trimmed = line.trim();
    if (!trimmed) return [];

    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      return [];
    }

    if (typeof json !== 'object' || json === null || !('type' in json)) {
      return [];
    }

    const obj = json as Record<string, unknown>;
    const type = obj.type as string;

    if (IGNORED_TYPES.has(type)) return [];

    switch (type) {
      case 'system':
        return this.parseSystem(obj);
      case 'assistant':
        return this.parseAssistant(obj);
      case 'user':
        return this.parseUser(obj);
      case 'result':
        return this.parseResult(obj);
      case 'control_response':
        return this.parseControlResponse(obj);
      case 'control_request':
        return this.parseControlRequest(obj);
      case 'stream_event':
        return this.parseStreamEvent(obj);
      default:
        return [];
    }
  }

  private parseSystem(obj: Record<string, unknown>): ChatStreamEvent[] {
    const subtype = obj.subtype as string;

    if (IGNORED_SYSTEM_SUBTYPES.has(subtype)) return [];

    if (subtype === 'init') {
      const result = cliSystemInitSchema.safeParse(obj);
      if (!result.success) return [];
      return [
        {
          type: 'init',
          sessionId: result.data.session_id,
          model: result.data.model,
          tools: result.data.tools,
        },
      ];
    } else if (subtype === 'status') {
      const status = obj.status;
      return [{ type: 'status', message: typeof status === 'string' ? status : '' }];
    }

    return [];
  }

  private parseAssistant(obj: Record<string, unknown>): ChatStreamEvent[] {
    const result = cliAssistantSchema.safeParse(obj);
    if (!result.success) return [];

    const content = result.data.message.content;
    if (!content || !Array.isArray(content)) return [];

    const events: ChatStreamEvent[] = [];

    for (const block of content) {
      switch (block.type) {
        case 'text':
          if (typeof block.text === 'string') {
            events.push({ type: 'text', content: block.text });
          }
          break;

        case 'thinking':
          if (typeof block.thinking === 'string') {
            events.push({ type: 'thinking', content: block.thinking });
          }
          break;

        case 'tool_use':
          if (typeof block.id === 'string' && typeof block.name === 'string') {
            this.toolNameMap.set(block.id, block.name);
            events.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input,
            });
          }
          break;

        case 'tool_result': {
          const id = block.tool_use_id as string;
          const name = this.toolNameMap.get(id) ?? id;
          const output =
            typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '');
          events.push({ type: 'tool_result', id, name, output });
          break;
        }
      }
    }

    return events;
  }

  private parseUser(obj: Record<string, unknown>): ChatStreamEvent[] {
    // User messages contain tool_result echo-backs
    const message = obj.message as Record<string, unknown> | undefined;
    if (!message) return [];

    const content = message.content as unknown[];
    if (!Array.isArray(content)) return [];

    const events: ChatStreamEvent[] = [];
    for (const block of content) {
      if (typeof block !== 'object' || block === null) continue;
      const b = block as Record<string, unknown>;
      if (b.type === 'tool_result' && typeof b.tool_use_id === 'string') {
        const id = b.tool_use_id;
        const name = this.toolNameMap.get(id) ?? id;
        const output = typeof b.content === 'string' ? b.content : JSON.stringify(b.content ?? '');
        events.push({ type: 'tool_result', id, name, output });
      }
    }

    return events;
  }

  private parseResult(obj: Record<string, unknown>): ChatStreamEvent[] {
    const result = cliResultSchema.safeParse(obj);
    if (!result.success) return [];

    const data = result.data;
    const usage = data.usage as Record<string, unknown> | undefined;
    const stats: ChatStats = {
      costUsd: typeof data.total_cost_usd === 'number' ? data.total_cost_usd : undefined,
      durationMs: data.duration_ms,
      inputTokens: typeof usage?.input_tokens === 'number' ? usage.input_tokens : undefined,
      outputTokens: typeof usage?.output_tokens === 'number' ? usage.output_tokens : undefined,
    };

    return [{ type: 'result', stats }];
  }

  private parseControlResponse(obj: Record<string, unknown>): ChatStreamEvent[] {
    const result = cliControlResponseSchema.safeParse(obj);
    if (!result.success) return [];

    const resp = result.data.response;
    const success = resp.subtype === 'success';

    return [
      {
        type: 'control_response',
        requestId: resp.request_id,
        success,
        response: success ? (resp as Record<string, unknown>) : undefined,
        error: resp.error,
      },
    ];
  }

  private parseStreamEvent(obj: Record<string, unknown>): ChatStreamEvent[] {
    const event = obj.event as Record<string, unknown> | undefined;
    if (!event || typeof event !== 'object') return [];

    if (event.type === 'content_block_delta') {
      const delta = event.delta as Record<string, unknown> | undefined;
      if (!delta) return [];
      if (delta.type === 'text_delta' && typeof delta.text === 'string') {
        return [{ type: 'text_delta', content: delta.text }];
      }
      if (delta.type === 'thinking' && typeof delta.thinking === 'string') {
        return [{ type: 'thinking_delta', content: delta.thinking }];
      }
    } else if (event.type === 'message_stop') {
      return [{ type: 'message_end' }];
    }

    return [];
  }

  private parseControlRequest(obj: Record<string, unknown>): ChatStreamEvent[] {
    const result = cliControlRequestSchema.safeParse(obj);
    if (!result.success) return [];

    const req = result.data.request;
    const requestId =
      ((result.data as Record<string, unknown>).request_id as string | undefined) ??
      ((req as Record<string, unknown>).request_id as string | undefined) ??
      '';

    return [
      {
        type: 'control_request',
        requestId,
        subtype: req.subtype,
        toolName: req.tool_name,
        input: (req as Record<string, unknown>).input,
        callbackId: req.callback_id,
        toolUseId: req.tool_use_id,
      },
    ];
  }
}

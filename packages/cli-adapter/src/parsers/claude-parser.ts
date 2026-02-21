import type { ChatStreamEvent } from '@code-quest/shared';
import { z } from 'zod';
import type { StreamParser } from '../types.ts';

const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }).passthrough(),
  z.object({ type: z.literal('thinking'), thinking: z.string() }).passthrough(),
  z
    .object({ type: z.literal('tool_use'), id: z.string(), name: z.string(), input: z.unknown() })
    .passthrough(),
  z
    .object({
      type: z.literal('tool_result'),
      tool_use_id: z.string().optional(),
      name: z.string().optional(),
      content: z.string().optional(),
      output: z.string().optional(),
    })
    .passthrough(),
]);

const claudeKnownEventSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('system'),
      subtype: z.string().optional(),
      session_id: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('assistant'),
      message: z
        .object({ content: z.array(contentBlockSchema).optional() })
        .passthrough()
        .optional(),
    })
    .passthrough(),
  z.object({ type: z.literal('user') }).passthrough(),
  z
    .object({
      type: z.literal('result'),
      total_cost_usd: z.number().optional(),
      duration_ms: z.number().optional(),
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
      usage: z
        .object({
          input_tokens: z.number().optional(),
          output_tokens: z.number().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('permission'),
      tool_name: z.string().optional(),
      tool: z.string().optional(),
      description: z.string().optional(),
      message: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('control_response'),
      response: z
        .object({
          subtype: z.string(),
          request_id: z.string(),
          response: z.unknown().optional(),
          error: z.string().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('control_request'),
      request_id: z.string(),
      request: z
        .object({
          subtype: z.string(),
          tool_name: z.string().optional(),
          input: z.unknown().optional(),
          callback_id: z.string().optional(),
          tool_use_id: z.string().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
]);

// Types we actively parse
const knownClaudeTypes = new Set([
  'system',
  'assistant',
  'user',
  'result',
  'permission',
  'control_response',
  'control_request',
]);

// Types we intentionally ignore (no error emitted)
const ignoredClaudeTypes = new Set([
  'rate_limit_event',
  'keep_alive',
  'streamlined_text',
  'streamlined_tool_use_summary',
  'error',
]);

export class ClaudeStreamParser implements StreamParser {
  private cliSessionId: string | null = null;

  parseLine(line: string): ChatStreamEvent[] {
    const trimmed = line.trim();
    if (!trimmed) return [];

    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      return [{ type: 'error', data: { message: `Failed to parse JSON: ${trimmed}` } }];
    }

    // Silently ignore known non-actionable types before schema parsing
    const type = (json as Record<string, unknown>).type;
    if (typeof type === 'string' && ignoredClaudeTypes.has(type)) {
      return [];
    }

    const result = claudeKnownEventSchema.safeParse(json);
    if (!result.success) {
      if (typeof type === 'string' && knownClaudeTypes.has(type)) {
        return [
          {
            type: 'error',
            data: {
              message: `Invalid event schema: ${result.error.issues.map((i) => i.message).join('; ')}`,
            },
          },
        ];
      }
      return [];
    }

    return this.parseEvent(result.data);
  }

  getCliSessionId(): string | null {
    return this.cliSessionId;
  }

  private parseEvent(event: z.infer<typeof claudeKnownEventSchema>): ChatStreamEvent[] {
    switch (event.type) {
      case 'system':
        if (event.subtype === 'init' && typeof event.session_id === 'string') {
          this.cliSessionId = event.session_id;
          return [{ type: 'init', data: { sessionId: event.session_id } }];
        }
        return [];

      case 'assistant':
        return this.parseAssistantMessage(event);

      case 'user':
        return [];

      case 'result':
        return this.parseResult(event);

      case 'permission':
        return [
          {
            type: 'permission_request',
            data: {
              toolName: event.tool_name ?? event.tool ?? '',
              description: event.description ?? event.message ?? '',
            },
          },
        ];

      case 'control_response':
        return this.parseControlResponse(event);

      case 'control_request':
        return this.parseControlRequest(event);

      default:
        return [];
    }
  }

  private parseAssistantMessage(
    event: Extract<z.infer<typeof claudeKnownEventSchema>, { type: 'assistant' }>,
  ): ChatStreamEvent[] {
    const content = event.message?.content;
    if (!content) return [];

    const events: ChatStreamEvent[] = [];
    for (const block of content) {
      switch (block.type) {
        case 'text':
          events.push({ type: 'text', data: { content: block.text } });
          break;
        case 'thinking':
          events.push({ type: 'thinking', data: { content: block.thinking } });
          break;
        case 'tool_use':
          events.push({
            type: 'tool_use',
            data: { id: block.id, name: block.name, input: block.input },
          });
          break;
        case 'tool_result':
          events.push({
            type: 'tool_result',
            data: {
              name: (block.tool_use_id ?? block.name) as string,
              output: (block.content ?? block.output) as string,
            },
          });
          break;
      }
    }

    return events;
  }

  private parseControlResponse(
    event: Extract<z.infer<typeof claudeKnownEventSchema>, { type: 'control_response' }>,
  ): ChatStreamEvent[] {
    const { response } = event;
    const success = response.subtype === 'success';
    const raw = (response.response ?? undefined) as Record<string, unknown> | undefined;

    return [
      {
        type: 'control_response' as const,
        data: {
          requestId: response.request_id,
          success,
          response: raw
            ? {
                models: raw.models as
                  | Array<{
                      value: string;
                      displayName: string;
                      description: string;
                      supportsEffort?: boolean;
                    }>
                  | undefined,
                account: raw.account as { email: string; subscriptionType: string } | undefined,
                commands: raw.commands as Array<{ name: string; description: string }> | undefined,
                outputStyle: raw.output_style as string | undefined,
                availableOutputStyles: raw.available_output_styles as string[] | undefined,
                pid: raw.pid as number | undefined,
              }
            : undefined,
          error: response.error,
        },
      },
    ];
  }

  private parseControlRequest(
    event: Extract<z.infer<typeof claudeKnownEventSchema>, { type: 'control_request' }>,
  ): ChatStreamEvent[] {
    const { request } = event;
    return [
      {
        type: 'control_request' as const,
        data: {
          requestId: event.request_id,
          subtype: request.subtype,
          toolName: request.tool_name,
          input: request.input,
          callbackId: request.callback_id,
          toolUseId: request.tool_use_id,
        },
      },
    ];
  }

  private parseResult(
    event: Extract<z.infer<typeof claudeKnownEventSchema>, { type: 'result' }>,
  ): ChatStreamEvent[] {
    return [
      {
        type: 'result',
        data: {
          stats: {
            costUsd: event.total_cost_usd,
            durationMs: event.duration_ms,
            inputTokens: event.usage?.input_tokens ?? event.input_tokens,
            outputTokens: event.usage?.output_tokens ?? event.output_tokens,
          },
        },
      },
    ];
  }
}

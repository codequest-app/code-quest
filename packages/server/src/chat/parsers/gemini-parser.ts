import type { ChatStreamEvent } from '@code-quest/shared';
import { z } from 'zod';
import type { StreamParser } from '../types.ts';

const geminiKnownEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('init'), session_id: z.string().optional() }).passthrough(),
  z
    .object({
      type: z.literal('message'),
      role: z.string(),
      content: z.unknown().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('tool_use'),
      tool_id: z.string(),
      tool_name: z.string(),
      parameters: z.unknown().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('tool_result'),
      tool_id: z.string(),
      output: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal('result'),
      stats: z
        .object({
          duration_ms: z.number().optional(),
          input_tokens: z.number().optional(),
          output_tokens: z.number().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
]);

const knownGeminiTypes = new Set(['init', 'message', 'tool_use', 'tool_result', 'result']);

/**
 * Parser for Gemini CLI stream-json output (gemini -o stream-json)
 */
export class GeminiStreamParser implements StreamParser {
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

    const result = geminiKnownEventSchema.safeParse(json);
    if (!result.success) {
      const type = (json as Record<string, unknown>).type;
      if (typeof type === 'string' && knownGeminiTypes.has(type)) {
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

  private parseEvent(event: z.infer<typeof geminiKnownEventSchema>): ChatStreamEvent[] {
    switch (event.type) {
      case 'init':
        if (typeof event.session_id === 'string') {
          this.cliSessionId = event.session_id;
          return [{ type: 'init', data: { sessionId: event.session_id } }];
        }
        return [];

      case 'message':
        return this.parseMessage(event);

      case 'tool_use':
        return [
          {
            type: 'tool_use',
            data: {
              id: event.tool_id,
              name: event.tool_name,
              input: event.parameters,
            },
          },
        ];

      case 'tool_result':
        return [
          {
            type: 'tool_result',
            data: {
              name: event.tool_id,
              output: event.output ?? '',
            },
          },
        ];

      case 'result':
        return [
          {
            type: 'result',
            data: {
              stats: {
                durationMs: event.stats?.duration_ms,
                inputTokens: event.stats?.input_tokens,
                outputTokens: event.stats?.output_tokens,
              },
            },
          },
        ];

      default:
        return [];
    }
  }

  private parseMessage(
    event: Extract<z.infer<typeof geminiKnownEventSchema>, { type: 'message' }>,
  ): ChatStreamEvent[] {
    if (event.role !== 'assistant') return [];

    const content = event.content;
    if (typeof content !== 'string') return [];

    return [{ type: 'text', data: { content } }];
  }
}

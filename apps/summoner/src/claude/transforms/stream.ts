import type { ClientMessage } from '@code-quest/shared';
import type { z } from 'zod';
import type { streamEventSchema } from '../schemas.ts';

type StreamMessage = z.infer<typeof streamEventSchema>;

function handleContentBlockDelta(
  delta: NonNullable<NonNullable<StreamMessage['event']>['delta']>,
  parentToolUseId: string | undefined,
): ClientMessage | null {
  const parent = parentToolUseId ? { parentToolUseId } : {};
  switch (delta.type) {
    case 'text_delta':
      return {
        name: 'stream:chunk',
        payload: { chunk: { kind: 'text', content: delta.text ?? '' }, ...parent },
      };
    case 'thinking_delta':
      return {
        name: 'stream:chunk',
        payload: { chunk: { kind: 'thinking', content: delta.thinking ?? '' }, ...parent },
      };
    case 'input_json_delta':
      return {
        name: 'stream:chunk',
        payload: { chunk: { kind: 'input_json', content: delta.partial_json ?? '' }, ...parent },
      };
    case 'citations_delta':
      return {
        name: 'stream:chunk',
        payload: {
          chunk: {
            kind: 'citations',
            content: '',
            citations: delta.citations ?? (delta.citation ? [delta.citation] : []),
          },
          ...parent,
        },
      };
    case 'signature_delta':
    case 'compaction_delta':
      return null;
    default:
      return {
        name: 'raw:event',
        payload: { rawType: 'unknown_delta', data: { deltaType: delta.type, ...delta } },
      };
  }
}

export function transformStream(raw: StreamMessage): ClientMessage | null {
  const streamData = raw.event;
  if (!streamData) return null;

  const parentToolUseId = raw.parent_tool_use_id ?? undefined;

  switch (streamData.type) {
    case 'content_block_delta': {
      const delta = streamData.delta;
      if (!delta) return null;
      return handleContentBlockDelta(delta, parentToolUseId);
    }
    case 'content_block_start': {
      const block = streamData.content_block;
      return {
        name: 'stream:block_start',
        payload: {
          index: streamData.index ?? 0,
          blockType: block?.type ?? 'unknown',
          ...(block && Object.keys(block).length > 1 ? { contentBlock: block } : {}),
          ...(parentToolUseId ? { parentToolUseId } : {}),
        },
      };
    }
    case 'content_block_stop':
      return null;
    case 'message_stop':
      return { name: 'stream:end', payload: {} };
    case 'message_start':
    case 'message_delta':
      return null;
    default:
      return null;
  }
}

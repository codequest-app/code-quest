import type { ClientMessage } from '../../types.ts';

export function transformStream(raw: Record<string, unknown>): ClientMessage | null {
  const streamData = raw.event as Record<string, unknown> | undefined;
  if (!streamData) return null;

  const parentToolUseId = (raw.parent_tool_use_id as string) ?? undefined;

  switch (streamData.type) {
    case 'content_block_delta': {
      const delta = streamData.delta as Record<string, unknown> | undefined;
      if (!delta) return null;

      switch (delta.type) {
        case 'text_delta':
          return {
            name: 'stream:chunk',
            payload: {
              chunk: { kind: 'text', content: (delta.text as string) ?? '' },
              ...(parentToolUseId ? { parentToolUseId } : {}),
            },
          };
        case 'thinking_delta':
          return {
            name: 'stream:chunk',
            payload: {
              chunk: { kind: 'thinking', content: (delta.thinking as string) ?? '' },
              ...(parentToolUseId ? { parentToolUseId } : {}),
            },
          };
        case 'input_json_delta':
          return {
            name: 'stream:chunk',
            payload: {
              chunk: { kind: 'input_json', content: (delta.partial_json as string) ?? '' },
              ...(parentToolUseId ? { parentToolUseId } : {}),
            },
          };
        case 'citations_delta':
          return {
            name: 'stream:chunk',
            payload: {
              chunk: {
                kind: 'citations',
                content: '',
                citations: [delta.citations ?? delta.citation].flat().filter(Boolean),
              },
              ...(parentToolUseId ? { parentToolUseId } : {}),
            },
          };
        case 'signature_delta':
        case 'compaction_delta':
          return null;
        default:
          return {
            name: 'raw:event',
            payload: {
              rawType: 'unknown_delta',
              data: { deltaType: delta.type, ...delta },
            },
          };
      }
    }
    case 'content_block_start': {
      const block = streamData.content_block as Record<string, unknown> | undefined;
      return {
        name: 'stream:block_start',
        payload: {
          index: (streamData.index as number) ?? 0,
          blockType: (block?.type as string) ?? 'unknown',
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

import type { ContentBlock } from '@code-quest/schemas';

/**
 * Build the shared `message:*` payload shape for user and assistant transforms.
 * Preserves optional-field elision (parentToolUseId/uuid only included if set).
 */
export function buildMessagePayload(
  blocks: ContentBlock[],
  parentToolUseId: string | undefined,
  uuid: string | undefined,
): { content: ContentBlock[]; parentToolUseId?: string; uuid?: string } {
  return {
    content: blocks,
    ...(parentToolUseId ? { parentToolUseId } : {}),
    ...(uuid ? { uuid } : {}),
  };
}

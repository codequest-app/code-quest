/**
 * Sync pipeline runner for Storybook fixtures.
 *
 * Takes an array of segment strings (from `segments.*()` builders) and runs
 * them through the same summoner transforms + client state reducers that the
 * real pipeline uses, returning a `Partial<ChannelState>` suitable for
 * passing to `withScenario()` / `withStoryChannel({ messages: ... })`.
 */

import type { ContentBlock } from '@code-quest/shared';
import { ClaudeAdapter } from '@code-quest/summoner';
import { messageHandlerOn } from '@/contexts/channel/handlers/message';
import { systemHandlerOn } from '@/contexts/channel/handlers/system';
import type { ChannelState } from '@/types/chat';
import { initialChannelState } from '@/types/chat';
import { mapSessionStats, msg, patchMeta } from '@/utils/message';

const adapter = new ClaudeAdapter();

/** Build a ChannelState by replaying segment strings through the real pipeline. */
export function buildChannelState(segments: string[]): Partial<ChannelState> {
  let state = initialChannelState('story');
  for (const seg of segments) {
    state = applySegment(state, seg);
  }
  return state;
}

function applySegment(state: ChannelState, seg: string): ChannelState {
  const parsed = adapter.parseLine(seg);
  if (parsed.status !== 'ok') return state;

  const output = adapter.transform(parsed.message);
  for (const clientMsg of output.messages) {
    state = applyClientMessage(state, clientMsg.name, clientMsg.payload);
  }
  return state;
}

function applyClientMessage(
  state: ChannelState,
  name: string,
  payload: Record<string, unknown>,
): ChannelState {
  switch (name) {
    case 'message:assistant':
      return applyAssistantContent(
        state,
        (payload.content as ContentBlock[]) ?? [],
        payload.parentToolUseId as string | undefined,
      );

    case 'message:user':
      return messageHandlerOn['message:user'](state, payload as never);

    case 'message:result': {
      const stats = mapSessionStats(payload.stats as never);
      const finalized = state.messages.map((m) =>
        m.type === 'thinking' && m.meta?.isStreaming
          ? patchMeta(m, { isStreaming: false, durationMs: stats.durationMs })
          : m,
      );
      return {
        ...state,
        status: 'idle',
        stats,
        statusText: null,
        messages: [
          ...finalized,
          msg({ role: 'system', type: 'result', content: '', meta: { stats } }),
        ],
      };
    }

    case 'stream:text':
      return messageHandlerOn['stream:text'](state, payload as never);

    case 'stream:tool_summary':
      return messageHandlerOn['stream:tool_summary'](state, payload as never);

    default: {
      const handler = systemHandlerOn[name as keyof typeof systemHandlerOn];
      if (handler) {
        return (handler as (s: ChannelState, p: never) => ChannelState)(state, {
          channelId: 'story',
          ...payload,
        } as never);
      }
      return state;
    }
  }
}

function applyAssistantContent(
  state: ChannelState,
  blocks: ContentBlock[],
  parentToolUseId?: string,
): ChannelState {
  const messages = [...state.messages];
  for (const block of blocks) {
    if (block.type === 'text') {
      messages.push(msg({ role: 'assistant', type: 'text', content: block.text, parentToolUseId }));
    } else if (block.type === 'thinking') {
      messages.push(
        msg({ role: 'assistant', type: 'thinking', content: block.thinking, parentToolUseId }),
      );
    } else if (block.type === 'tool_use') {
      messages.push(
        msg({
          role: 'assistant',
          type: 'tool_use',
          content: block.toolName,
          meta: {
            toolId: block.toolId,
            input: block.input as Record<string, unknown>,
            ...(block.model ? { model: block.model } : {}),
          },
          parentToolUseId,
        }),
      );
    }
  }
  return { ...state, messages };
}

import { describe, expect, it } from 'vitest';
import type { ChannelState } from '@/types/chat';
import { initialChannelState } from '@/types/chat';
import type { AssistantTurn } from '@/types/ui';
import { streamingHandlerOn } from '../streaming.ts';

const onMessageStart = streamingHandlerOn['stream:message_start'];
const onBlockStart = streamingHandlerOn['stream:block_start'];
const onChunk = streamingHandlerOn['stream:chunk'];
const onBlockStop = streamingHandlerOn['stream:block_stop'];
const onAssistant = streamingHandlerOn['message:assistant'];

function withStreamingTurn(overrides?: Partial<ChannelState>): ChannelState {
  let state = { ...initialChannelState('ch'), ...overrides };
  state = onMessageStart(state, {
    channelId: 'ch',
    model: 'claude-opus-4-6',
    messageId: 'msg_1',
    usage: { inputTokens: 100 },
  });
  return state;
}

function lastTurn(state: ChannelState): AssistantTurn {
  const last = state.messages[state.messages.length - 1];
  if (!last || last.type !== 'assistant_turn') throw new Error('not assistant_turn');
  return last as AssistantTurn;
}

describe('tool_use streaming lifecycle', () => {
  describe('stream:block_start [tool_use]', () => {
    it('pushes a tool_use block to the streaming turn', () => {
      let state = withStreamingTurn();
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_1', name: 'Edit' },
      });
      const turn = lastTurn(state);
      expect(turn.blocks).toHaveLength(1);
      expect(turn.blocks[0]!.type).toBe('tool_use');
      expect(turn.blocks[0]!.content).toBe('Edit');
      expect(turn.blocks[0]!).toMatchObject({ toolId: 'toolu_1', input: {} });
    });

    it('sets streamingToolUseId', () => {
      let state = withStreamingTurn();
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_1', name: 'Edit' },
      });
      expect(state.streamingToolUseId).toBe('toolu_1');
    });

    it('auto-creates streaming turn for non-tool_use block_start', () => {
      const state = initialChannelState('ch');
      const next = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'text',
      });
      expect(next.messages).toHaveLength(1);
      expect((next.messages[0] as AssistantTurn).blocks).toHaveLength(1);
      expect(next.streamingToolUseId).toBeUndefined();
    });
  });

  describe('stream:chunk input_json with streamingToolUseId', () => {
    it('patches partialInput on the correct tool_use block', () => {
      let state = withStreamingTurn();
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_1', name: 'Edit' },
      });
      state = onChunk(state, {
        channelId: 'ch',
        chunk: { kind: 'input_json', content: '{"file' },
      });
      expect(lastTurn(state).blocks[0]!).toMatchObject({ partialInput: '{"file' });
    });

    it('does not patch when streamingToolUseId is undefined', () => {
      const state = withStreamingTurn();
      const next = onChunk(state, {
        channelId: 'ch',
        chunk: { kind: 'input_json', content: '{"file' },
      });
      expect(lastTurn(next).blocks).toHaveLength(0);
    });

    it('does not patch a different tool_use block', () => {
      let state = withStreamingTurn();
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_old', name: 'Read' },
      });
      state = onBlockStop(state, { channelId: 'ch', index: 0 });
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 1,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_2', name: 'Edit' },
      });
      state = onChunk(state, {
        channelId: 'ch',
        chunk: { kind: 'input_json', content: '{"old' },
      });
      const turn = lastTurn(state);
      expect(turn.blocks[0]!).not.toHaveProperty('partialInput');
      expect(turn.blocks[1]!).toMatchObject({ partialInput: '{"old' });
    });
  });

  describe('stream:block_stop clears streamingToolUseId', () => {
    it('clears streamingToolUseId', () => {
      let state = withStreamingTurn();
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_1', name: 'Edit' },
      });
      state = onBlockStop(state, { channelId: 'ch', index: 0 });
      expect(state.streamingToolUseId).toBeUndefined();
    });
  });

  describe('message:assistant patches existing tool_use in turn', () => {
    it('patches input and clears partialInput when streaming turn exists', () => {
      let state = withStreamingTurn();
      state = onBlockStart(state, {
        channelId: 'ch',
        index: 0,
        blockType: 'tool_use',
        contentBlock: { type: 'tool_use', id: 'toolu_1', name: 'Edit' },
      });
      state = onChunk(state, {
        channelId: 'ch',
        chunk: { kind: 'input_json', content: '{"file_path":"/a.ts"}' },
      });
      state = onAssistant(state, {
        channelId: 'ch',
        content: [
          {
            type: 'tool_use',
            toolId: 'toolu_1',
            toolName: 'Edit',
            input: { file_path: '/a.ts', old_string: 'a', new_string: 'b' },
          },
        ],
      } as never);
      const turn = lastTurn(state);
      expect(turn.blocks).toHaveLength(1);
      expect(turn.blocks[0]!).toMatchObject({
        toolId: 'toolu_1',
        input: { file_path: '/a.ts', old_string: 'a', new_string: 'b' },
      });
      expect(turn.blocks[0]!.partialInput).toBeUndefined();
    });

    it('creates new AssistantTurn when no streaming turn (history replay)', () => {
      const state = initialChannelState('ch');
      const next = onAssistant(state, {
        channelId: 'ch',
        content: [
          {
            type: 'tool_use',
            toolId: 'toolu_1',
            toolName: 'Edit',
            input: { file_path: '/a.ts' },
          },
        ],
      } as never);
      expect(next.messages).toHaveLength(1);
      const turn = lastTurn(next);
      expect(turn.type).toBe('assistant_turn');
      expect(turn.blocks[0]!.type).toBe('tool_use');
    });
  });
});

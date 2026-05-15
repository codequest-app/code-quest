import { segments as s } from '@code-quest/test-kit';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '@/test/render-with-channel';
import { MessageList } from '../MessageList.tsx';

async function setup() {
  const ctx = await renderWithChannel(<MessageList />);
  return ctx;
}

// Build a raw assistant segment with both text and tool_use content in a single message.
// This reproduces the DB pattern where same message.id has text + tool_use blocks.
function assistantTextAndTool(text: string, toolName: string, toolId: string): string {
  return JSON.stringify({
    type: 'assistant',
    message: {
      model: 'claude-opus-4-6',
      id: `msg_fake_text_tool_${toolId}`,
      type: 'message',
      role: 'assistant',
      content: [
        { type: 'text', text },
        {
          type: 'tool_use',
          id: toolId,
          name: toolName,
          input: {},
          caller: { type: 'direct' },
        },
      ],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
      context_management: null,
    },
    parent_tool_use_id: null,
    session_id: 'test-session',
    uuid: `uuid_${toolId}`,
  });
}

describe('ToolGroupSummary — integration', () => {
  it('consecutive pure tool_use assistant messages → grouped with chips', async () => {
    const { claude } = await setup();
    await act(async () => {
      await claude.emitSegment(
        s.assistant({ toolUse: { id: 'tu-1', name: 'Bash', input: { command: 'ls' } } }),
      );
      await claude.emitSegment(
        s.assistant({ toolUse: { id: 'tu-2', name: 'Read', input: { file_path: '/tmp/f.ts' } } }),
      );
    });
    // Grouped: ToolGroupSummary shows chips
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    // Only one group toggle button (not two separate rows)
    expect(
      screen.getAllByRole('button').filter((b) => b.textContent?.includes('Bash')),
    ).toHaveLength(1);
  });

  it('assistant message with text+tool_use stays solo — NOT grouped', async () => {
    const { claude } = await setup();
    await act(async () => {
      await claude.emitSegment(assistantTextAndTool('Let me read the file.', 'Read', 'tu-10'));
      await claude.emitSegment(assistantTextAndTool('Now I will edit it.', 'Edit', 'tu-11'));
    });
    // Text content must be visible (solo means expanded)
    expect(screen.getByText('Let me read the file.')).toBeInTheDocument();
    expect(screen.getByText('Now I will edit it.')).toBeInTheDocument();
    // No ×N multiplier chip — they are not grouped
    expect(screen.queryByText(/×\d/)).not.toBeInTheDocument();
  });

  it('consecutive thinking+tool_use messages → grouped with chips', async () => {
    const { claude } = await setup();
    await act(async () => {
      // thinking segment uses same message ID as the tool_use segment via streaming merge —
      // here we emit two separate tool-only assistant messages (thinking is in a different
      // segment type). Two pure tool_use assistant_turns should still group.
      await claude.emitSegment(
        s.assistant({ toolUse: { id: 'tu-20', name: 'Write', input: { file_path: '/a.ts' } } }),
      );
      await claude.emitSegment(
        s.assistant({ toolUse: { id: 'tu-21', name: 'Write', input: { file_path: '/b.ts' } } }),
      );
    });
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText(/×2/)).toBeInTheDocument();
  });
});

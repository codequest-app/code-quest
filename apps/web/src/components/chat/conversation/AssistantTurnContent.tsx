import { useShallow } from 'zustand/react/shallow';
import { useChannelStore } from '@/stores/ChannelStoreContext';
import type { AssistantTurn, Block } from '@/types/ui';
import { Expandable } from '../renderers/Expandable.tsx';
import { MarkdownContent } from '../renderers/MarkdownContent.tsx';
import { CitationsPanel } from '../session/CitationsPanel.tsx';
import { ToolUseBlock } from '../tool-use/ToolUseBlock.tsx';
import { ThinkingBlock } from './ThinkingBlock.tsx';

function ToolUseBlockWithStore({ block }: { block: Block }): React.JSX.Element {
  const toolId = block.toolId ?? '';
  const { task, result } = useChannelStore(
    useShallow((s) => ({
      task: s.tasks.get(toolId),
      result: s.results.get(toolId),
    })),
  );
  return (
    <ToolUseBlock
      toolName={block.content}
      input={block.input}
      result={result}
      task={task}
      partialInput={block.partialInput}
      defaultOpen={false}
    />
  );
}

export function AssistantTurnContent({
  message,
  isLastTurn,
}: {
  message: AssistantTurn;
  isLastTurn?: boolean;
}): React.JSX.Element | null {
  const blocks = message.blocks.map((block) => {
    if (block.type === 'thinking') {
      if (!block.content.trim()) return null;
      return (
        <ThinkingBlock
          key={block.id}
          content={block.content}
          budgetTokens={block.budget_tokens}
          durationMs={block.durationMs}
          isStreaming={block.isStreaming}
        />
      );
    }
    if (block.type === 'text') {
      return (
        <Expandable key={block.id} maxHeight={600} defaultOpen={isLastTurn ?? false}>
          <div className="leading-relaxed">
            <MarkdownContent content={block.content} />
            {block.citations && <CitationsPanel citations={block.citations} />}
          </div>
        </Expandable>
      );
    }
    if (block.type === 'tool_use' && block.toolId) {
      return <ToolUseBlockWithStore key={block.id} block={block} />;
    }
    return <p key={block.id}>{block.content}</p>;
  });
  if (blocks.every((b) => b == null)) return null;
  return <>{blocks}</>;
}

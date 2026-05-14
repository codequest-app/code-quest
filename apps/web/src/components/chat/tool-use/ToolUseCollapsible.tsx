import { BlockCollapsible } from '@/components/chat/tool-use/BlockCollapsible';
import type { ToolResult } from '@/types/chat';
import type { Task } from '@/types/task';
import { AGENT_TOOLS, getToolHeaderInfo } from '@/utils/tool-utils';
import { CollapsibleBlock } from '../ui/CollapsibleBlock';
import { TaskBadge } from './TaskBadge.tsx';
import { ToolUseBlock } from './ToolUseBlock.tsx';
import { getToolIcon, ToolUseHeader } from './ToolUseHeader.tsx';

interface ToolUseCollapsibleProps {
  toolName: string;
  input: Record<string, unknown>;
  toolId?: string;
  task?: Task;
  result?: ToolResult;
  partialInput?: string;
  isLastTurn?: boolean;
}

export function ToolUseCollapsible({
  toolName,
  input,
  toolId,
  task,
  result,
  partialInput,
  isLastTurn,
}: ToolUseCollapsibleProps): React.JSX.Element {
  const taskType = task?.taskType;
  const headerInfo = getToolHeaderInfo(toolName, input);
  const detail = task?.description && !headerInfo.detail ? task.description : headerInfo.detail;
  const header = (
    <ToolUseHeader
      icon={getToolIcon(toolName)}
      name={headerInfo.name}
      detail={detail}
      range={headerInfo.range}
      badge={
        AGENT_TOOLS.has(toolName) || taskType ? (
          <TaskBadge toolName={toolName} input={input} task={task} />
        ) : undefined
      }
    />
  );
  const body = (
    <ToolUseBlock
      toolName={toolName}
      input={input}
      result={result}
      partialInput={partialInput}
      taskType={taskType}
    />
  );

  if (toolId) {
    return (
      <BlockCollapsible blockId={toolId} initialOpen={isLastTurn} header={header}>
        {body}
      </BlockCollapsible>
    );
  }
  return (
    <CollapsibleBlock header={header} defaultOpen={isLastTurn ?? false}>
      {body}
    </CollapsibleBlock>
  );
}

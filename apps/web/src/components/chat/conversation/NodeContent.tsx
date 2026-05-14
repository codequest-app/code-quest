import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Copyable } from '@/components/chat/ui/Copyable';
import { JsonViewer } from '@/components/chat/ui/JsonViewer';
import { useChannelStore } from '@/stores/ChannelStoreContext';
import type { ToolResult } from '@/types/chat';
import type { Task } from '@/types/task';
import type { AssistantTurn, ForkFn, Message, RewindFn } from '@/types/ui';
import { basename } from '@/utils/basename';
import { getModel, getToolId } from '@/utils/message-helpers';
import { Badge } from '../../ui/Badge.tsx';
import { CODE_BLOCK_CLASS } from '../renderers/ansi.tsx';
import { MarkdownContent } from '../renderers/MarkdownContent.tsx';
import {
  HookDiagnosticsContent,
  HookResponseContent,
  HookStartedContent,
} from '../tool-use/HookBlocks.tsx';
import { renderIcon } from '../tool-use/message-type-icons.tsx';
import {
  CompactBoundaryContent,
  ContentBlockStart,
  ControlResponseContent,
  DocumentContent,
  ErrorContent,
  ImageContent,
  InterruptContent,
  MetaContent,
  PendingActionContent,
  RateLimitContent,
  ResultContent,
  SlashCommandResultContent,
  StreamlinedTextContent,
  StreamlinedToolSummaryContent,
  TaskStartedContent,
} from '../tool-use/SystemBlocks.tsx';
import { ToolResultBlock } from '../tool-use/ToolResultBlock.tsx';
import { ToolUseCollapsible } from '../tool-use/ToolUseCollapsible.tsx';
import { CollapsibleBlock } from '../ui/CollapsibleBlock';
import { Expandable } from '../ui/Expandable';
import { AssistantTurnContent } from './AssistantTurnContent.tsx';
import { ContentErrorBoundary } from './ContentErrorBoundary';
import { MessageActions } from './MessageActions.tsx';
import { SubagentChildren } from './SubagentChildren.tsx';
import { ThinkingBlock } from './ThinkingBlock.tsx';
import { UserTextContent } from './UserTextContent.tsx';

const NO_COPY_TYPES = new Set([
  'tool_use',
  'tool_result',
  'pending_action',
  'action_result',
  'image',
  'document',
  'thinking',
  'redacted_thinking',
]);

interface NodeContentProps {
  message: Message;
  childrenIndex?: Map<string, Message[]>;
  showAvatar?: boolean;
  isLastTurn?: boolean;
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onStopTask?: (taskId: string) => void;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

export const NodeContent: React.MemoExoticComponent<
  (props: NodeContentProps) => React.JSX.Element | null
> = memo(function NodeContent({
  message,
  childrenIndex,
  showAvatar,
  isLastTurn,
  onRewind,
  onFork,
  onStopTask,
  onDiffRespond,
}: NodeContentProps): React.JSX.Element | null {
  const isUser = message.role === 'user';
  const toolId = getToolId(message);
  const { task, result } = useChannelStore(
    useShallow((s) => ({
      task: toolId ? s.tasks.get(toolId) : undefined,
      result: toolId ? s.results.get(toolId) : undefined,
    })),
  );
  const children = toolId && childrenIndex ? childrenIndex.get(toolId) : undefined;

  const body = renderContent(message, task, result, onDiffRespond, isLastTurn);

  if (body == null) return null;

  if (isUser) {
    return (
      <div
        className="group text-sm py-1 relative"
        data-role={message.role}
        data-type={message.type}
      >
        <div className="bg-surface rounded-lg px-4 py-3 break-words select-text">
          <ContentErrorBoundary>{body}</ContentErrorBoundary>
        </div>
        {showAvatar && onRewind && (
          <div className="absolute top-2 right-2">
            <MessageActions
              cliUuid={message.cliUuid}
              messageRole={message.role}
              messageContent={message.content}
              onRewind={onRewind}
              onFork={onFork}
            />
          </div>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.attachments.map((att) => {
              const fileName = basename(att.filename);
              const range =
                att.startLine != null
                  ? `:${att.startLine}${att.endLine != null ? `-${att.endLine}` : ''}`
                  : '';
              return (
                <Badge key={`${att.filename}-${att.startLine}`} size="xs">
                  {fileName}
                  {range}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const showCopy =
    message.role !== 'system' && !NO_COPY_TYPES.has(message.type) && message.content.length > 0;
  return (
    <div className="group text-sm relative" data-role={message.role} data-type={message.type}>
      <div className="min-w-0" data-type={message.type === 'text' ? 'text' : undefined}>
        <ContentErrorBoundary>{body}</ContentErrorBoundary>
      </div>
      {showCopy && <Copyable text={message.content} aria-label="message-copy" />}
      {children && children.length > 0 && (
        <SubagentChildren
          messages={children}
          childrenIndex={childrenIndex}
          onStopTask={onStopTask}
          onDiffRespond={onDiffRespond}
          parentToolId={toolId}
          model={getModel(message)}
        />
      )}
    </div>
  );
});

function resolveTask(
  message: NodeContentProps['message'],
  task: Task | undefined,
): Task | undefined {
  if (task) return task;
  if (message.type === 'tool_use' && message.taskStatus) {
    return {
      toolUseId: message.toolId ?? '',
      taskType: message.taskType,
      status: message.taskStatus,
      description: '',
    } as Task;
  }
  return undefined;
}

function renderContent(
  message: NodeContentProps['message'],
  task: Task | undefined,
  result: ToolResult | undefined,
  onDiffRespond?: (toolId: string, accepted: boolean) => void,
  isLastTurn?: boolean,
): React.ReactNode {
  if (message.type === 'thinking' && !message.content.trim()) return null;
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    if (turn.blocks.every((b) => b.type === 'thinking' && !b.content.trim())) return null;
  }
  if (message.type === 'text') {
    const { renderAs } = message;
    const isPlain = message.role === 'user' && renderAs !== 'markdown';
    if (isPlain) {
      return <UserTextContent content={message.content} />;
    }
    return (
      <Expandable maxHeight={600} defaultOpen={true}>
        <div className="leading-relaxed">
          <MarkdownContent content={message.content} />
        </div>
      </Expandable>
    );
  }
  if (message.type === 'thinking')
    return (
      <ThinkingBlock
        content={message.content}
        budgetTokens={message.budget_tokens}
        durationMs={message.durationMs}
        isStreaming={message.isStreaming}
        blockId={message.id}
      />
    );
  if (message.type === 'tool_use') {
    return (
      <ToolUseCollapsible
        toolName={message.content}
        input={message.input ?? {}}
        toolId={message.toolId}
        task={resolveTask(message, task)}
        result={result ?? (message.result as ToolResult | undefined)}
        partialInput={message.partialInput}
        isLastTurn={isLastTurn}
      />
    );
  }
  if (message.type === 'assistant_turn')
    return <AssistantTurnContent message={message as AssistantTurn} isLastTurn={isLastTurn} />;
  if (message.type === 'tool_result') {
    return (
      <ToolResultBlock
        content={message.content}
        toolId={message.toolId}
        name={message.name}
        is_error={message.is_error}
        contentBlocks={message.contentBlocks}
        onDiffRespond={onDiffRespond}
      />
    );
  }
  if (message.type === 'error') return <ErrorContent content={message.detail ?? message.content} />;
  if (message.type === 'result') return <ResultContent stats={message.stats} />;
  if (message.type === 'task_started') {
    return <TaskStartedContent content={message.content} taskType={message.taskType} />;
  }
  if (message.type === 'rate_limit_event') {
    return <RateLimitContent content={message.content} rateLimitInfo={message.rateLimitInfo} />;
  }
  if (message.type === 'hook_started') {
    return <HookStartedContent content={message.content} hookEvent={message.hookEvent} />;
  }
  if (message.type === 'hook_response') {
    return <HookResponseContent content={message.content} output={message.output} />;
  }
  if (message.type === 'hook_diagnostics') {
    return <HookDiagnosticsContent content={message.content} diagnostics={message.diagnostics} />;
  }
  if (message.type === 'image') return <ImageContent source={message.source} />;
  if (message.type === 'document') {
    return (
      <DocumentContent content={message.content} title={message.title} source={message.source} />
    );
  }
  if (message.type === 'content_block_start') {
    return <ContentBlockStart blockType={message.blockType} />;
  }
  if (message.type === 'unknown_delta' || message.type === 'raw_event')
    return (
      <CollapsibleBlock icon={renderIcon(message.type)} label={message.content}>
        {message.data != null && <JsonViewer data={message.data} className={CODE_BLOCK_CLASS} />}
      </CollapsibleBlock>
    );
  if (message.type === 'unhandled')
    return (
      <CollapsibleBlock icon={renderIcon('unknown_delta')} label={message.content}>
        {message.event != null && <JsonViewer data={message.event} className={CODE_BLOCK_CLASS} />}
      </CollapsibleBlock>
    );
  if (message.type === 'redacted_thinking')
    return <div className="text-xs text-text-muted italic">Thinking (redacted)</div>;
  if (message.type === 'pending_action') return <PendingActionContent content={message.content} />;
  if (message.type === 'action_result') return <ControlResponseContent content={message.content} />;
  if (message.type === 'streamlined_text')
    return <StreamlinedTextContent content={message.content} defaultOpen={isLastTurn ?? false} />;
  if (message.type === 'streamlined_tool_use_summary')
    return <StreamlinedToolSummaryContent content={message.content} />;
  if (message.type === 'compact_boundary') return <CompactBoundaryContent />;
  if (message.type === 'meta') return <MetaContent content={message.content} />;
  if (message.type === 'interrupt') return <InterruptContent />;
  if (message.type === 'slash_command_result')
    return <SlashCommandResultContent content={message.content} />;
  return <p>{message.content}</p>;
}

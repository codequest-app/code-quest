import { memo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChannelStore } from '@/stores/ChannelStoreContext';
import type { ToolResult } from '@/types/chat';
import type { Task } from '@/types/task';
import type { AssistantTurn, ForkFn, Message, RewindFn } from '@/types/ui';
import { basename } from '@/utils/basename';
import { getModel, getToolId } from '@/utils/message-helpers';
import { parseAttachments } from '@/utils/parse-attachments';
import { ContentErrorBoundary } from '../renderers/ContentErrorBoundary.tsx';
import { Copyable } from '../renderers/Copyable.tsx';
import { Expandable } from '../renderers/Expandable.tsx';
import { JsonViewer } from '../renderers/JsonViewer.tsx';
import { MarkdownContent } from '../renderers/MarkdownContent.tsx';
import { CollapsibleBlock } from '../renderers/primitives.tsx';
import { ImagePreviewModal } from '../tool-use/ImagePreviewModal.tsx';
import {
  CompactBoundaryContent,
  ContentBlockStart,
  ControlResponseContent,
  DocumentContent,
  ErrorContent,
  HookDiagnosticsContent,
  HookResponseContent,
  HookStartedContent,
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
  ToolResultBlock,
} from '../tool-use/index.ts';
import { renderIcon } from '../tool-use/message-type-icons.tsx';
import { ToolUseBlock } from '../tool-use/ToolUseBlock.tsx';
import { AssistantTurnContent } from './AssistantTurnContent.tsx';
import { MessageActions } from './MessageActions.tsx';
import { SubagentChildren } from './SubagentChildren.tsx';
import { ThinkingBlock } from './ThinkingBlock.tsx';

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

const JSON_VIEWER_CLASS =
  'bg-code-block p-3 rounded-lg overflow-x-auto text-xs border border-border';

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
                <span
                  key={`${att.filename}-${att.startLine}`}
                  className="inline-flex items-center gap-1 text-xs text-text-muted bg-white/5 border border-border/50 rounded px-2 py-0.5"
                >
                  {fileName}
                  {range}
                </span>
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

function UserTextContent({
  content,
  isLastTurn,
}: {
  content: string;
  isLastTurn?: boolean;
}): React.JSX.Element {
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);
  const { text, attachments } = parseAttachments(content);

  return (
    <>
      <Expandable maxHeight={600} defaultOpen={isLastTurn ?? false}>
        <div className="leading-relaxed whitespace-pre-wrap">
          {text}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((att) =>
                att.isImage ? (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by ImagePreviewModal's Escape listener
                  <img
                    key={att.name}
                    src={att.dataUrl}
                    alt={att.name}
                    className="max-h-32 rounded cursor-pointer"
                    onClick={() => setPreview({ src: att.dataUrl, alt: att.name })}
                  />
                ) : (
                  <span
                    key={att.name}
                    className="inline-flex items-center gap-1 text-xs text-text-muted bg-white/5 border border-border/50 rounded px-2 py-0.5"
                  >
                    {att.name}
                  </span>
                ),
              )}
            </div>
          )}
        </div>
      </Expandable>
      {preview && (
        <ImagePreviewModal src={preview.src} alt={preview.alt} onClose={() => setPreview(null)} />
      )}
    </>
  );
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
      return <UserTextContent content={message.content} isLastTurn={isLastTurn} />;
    }
    return (
      <Expandable maxHeight={600} defaultOpen={isLastTurn ?? false}>
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
      />
    );
  if (message.type === 'tool_use') {
    const resolvedTask =
      task ??
      (message.taskStatus
        ? ({
            toolUseId: message.toolId ?? '',
            taskType: message.taskType,
            status: message.taskStatus,
            description: '',
          } as Task)
        : undefined);
    return (
      <ToolUseBlock
        toolName={message.content}
        input={message.input}
        result={result ?? (message.result as ToolResult | undefined)}
        task={resolvedTask}
        partialInput={message.partialInput}
        defaultOpen={false}
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
        {message.data != null && <JsonViewer data={message.data} className={JSON_VIEWER_CLASS} />}
      </CollapsibleBlock>
    );
  if (message.type === 'unhandled')
    return (
      <CollapsibleBlock icon={renderIcon('unknown_delta')} label={message.content}>
        {message.event != null && <JsonViewer data={message.event} className={JSON_VIEWER_CLASS} />}
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

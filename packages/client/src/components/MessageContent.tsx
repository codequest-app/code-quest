import type { Message } from '../types/ui';
import { CitationsPanel } from './CitationsPanel';
import { JsonViewer } from './JsonViewer';
import { MarkdownContent } from './MarkdownContent';
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
  ToolUseBlock,
} from './message-blocks';
import { CollapsibleBlock } from './message-blocks/shared';
import { ThinkingBlock } from './ThinkingBlock';

const JSON_VIEWER_CLASS =
  'bg-code-block p-3 rounded-lg overflow-x-auto text-xs border border-border';

function CollapsibleDataContent({
  icon,
  content,
  meta,
}: {
  icon: string;
  content: string;
  meta?: Record<string, unknown>;
}) {
  return (
    <CollapsibleBlock icon={icon} label={content}>
      {meta?.data != null && <JsonViewer data={meta.data} className={JSON_VIEWER_CLASS} />}
    </CollapsibleBlock>
  );
}

function UnhandledContent({ content, meta }: { content: string; meta?: Record<string, unknown> }) {
  return (
    <CollapsibleBlock icon="❓" label={content}>
      {meta?.event != null && <JsonViewer data={meta.event} className={JSON_VIEWER_CLASS} />}
    </CollapsibleBlock>
  );
}

function renderUserText(message: Message & { type: 'text' }): React.ReactNode {
  if (message.role !== 'user') return <MarkdownContent content={message.content} />;
  switch (message.meta?.source ?? 'typed') {
    case 'skill':
      return <MarkdownContent content={message.content} />;
    case 'command':
    case 'reminder':
      return null;
    default:
      return message.content;
  }
}

export function renderBody(
  message: Message,
  onDiffRespond?: (toolId: string, accepted: boolean) => void,
): React.ReactNode {
  const { content } = message;
  switch (message.type) {
    case 'text': {
      const body = renderUserText(message);
      return (
        <>
          {body}
          {message.meta?.citations && <CitationsPanel citations={message.meta.citations} />}
        </>
      );
    }
    case 'thinking':
      if (!content.trim()) return null;
      return (
        <ThinkingBlock
          content={content}
          budgetTokens={message.meta?.budget_tokens}
          durationMs={message.meta?.durationMs}
          isStreaming={message.meta?.isStreaming}
        />
      );
    case 'tool_use':
      return <ToolUseBlock content={content} meta={message.meta} />;
    case 'tool_result':
      return (
        <ToolResultBlock content={content} meta={message.meta} onDiffRespond={onDiffRespond} />
      );
    case 'redacted_thinking':
      return <div className="text-xs text-text-muted italic py-1">Thinking (redacted)</div>;
    case 'result':
      return <ResultContent meta={message.meta} />;
    case 'error':
      return <ErrorContent content={message.meta?.detail ?? content} />;
    case 'pending_action':
      return <PendingActionContent content={content} />;
    case 'action_result':
      return <ControlResponseContent content={content} />;
    case 'streamlined_text':
      return <StreamlinedTextContent content={content} />;
    case 'streamlined_tool_use_summary':
      return <StreamlinedToolSummaryContent content={content} />;
    case 'task_started':
      return <TaskStartedContent content={content} meta={message.meta} />;
    case 'compact_boundary':
      return <CompactBoundaryContent />;
    case 'rate_limit_event':
      return <RateLimitContent content={content} meta={message.meta} />;
    case 'hook_started':
      return <HookStartedContent content={content} meta={message.meta} />;
    case 'hook_response':
      return <HookResponseContent content={content} meta={message.meta} />;
    case 'hook_diagnostics':
      return <HookDiagnosticsContent content={content} meta={message.meta} />;
    case 'unknown_delta':
      return <CollapsibleDataContent icon="❔" content={content} meta={message.meta} />;
    case 'raw_event':
      return <CollapsibleDataContent icon="📦" content={content} meta={message.meta} />;
    case 'unhandled':
      return <UnhandledContent content={content} meta={message.meta} />;
    case 'image':
      return <ImageContent meta={message.meta} />;
    case 'document':
      return <DocumentContent content={content} meta={message.meta} />;
    case 'content_block_start':
      return <ContentBlockStart meta={message.meta} />;
    case 'meta':
      return <MetaContent content={content} />;
    case 'interrupt':
      return <InterruptContent />;
    case 'slash_command_result':
      return <SlashCommandResultContent content={content} />;
    default:
      return <p>{content}</p>;
  }
}

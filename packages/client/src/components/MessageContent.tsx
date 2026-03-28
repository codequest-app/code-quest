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
  'bg-code-block p-3 rounded-lg overflow-x-auto text-[13px] border border-border';

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

export function renderBody(
  message: Message,
  onDiffRespond?: (toolId: string, accepted: boolean) => void,
): React.ReactNode {
  const { content, meta } = message;
  switch (message.type) {
    case 'text':
      return (
        <>
          <MarkdownContent content={content} />
          {meta?.citations && (
            <CitationsPanel
              citations={
                meta.citations as Array<{ url?: string; title?: string; citedText?: string }>
              }
            />
          )}
        </>
      );
    case 'thinking':
      return (
        <ThinkingBlock
          content={content}
          budgetTokens={meta?.budget_tokens as number | undefined}
          durationMs={meta?.durationMs as number | null | undefined}
          isStreaming={meta?.isStreaming as boolean | undefined}
        />
      );
    case 'tool_use':
      return <ToolUseBlock content={content} meta={meta} />;
    case 'tool_result':
      return <ToolResultBlock content={content} meta={meta} onDiffRespond={onDiffRespond} />;
    case 'result':
      return <ResultContent meta={meta} />;
    case 'error':
      return <ErrorContent content={content} />;
    case 'pending_action':
      return <PendingActionContent content={content} />;
    case 'action_result':
      return <ControlResponseContent content={content} />;
    case 'streamlined_text':
      return <StreamlinedTextContent content={content} />;
    case 'streamlined_tool_use_summary':
      return <StreamlinedToolSummaryContent content={content} />;
    case 'task_started':
      return <TaskStartedContent content={content} meta={meta} />;
    case 'compact_boundary':
      return <CompactBoundaryContent />;
    case 'rate_limit_event':
      return <RateLimitContent content={content} meta={meta} />;
    case 'hook_started':
      return <HookStartedContent content={content} meta={meta} />;
    case 'hook_response':
      return <HookResponseContent content={content} meta={meta} />;
    case 'hook_diagnostics':
      return <HookDiagnosticsContent content={content} meta={meta} />;
    case 'unknown_delta':
      return <CollapsibleDataContent icon="❔" content={content} meta={meta} />;
    case 'raw_event':
      return <CollapsibleDataContent icon="📦" content={content} meta={meta} />;
    case 'unhandled':
      return <UnhandledContent content={content} meta={meta} />;
    case 'image':
      return <ImageContent meta={meta} />;
    case 'document':
      return <DocumentContent content={content} meta={meta} />;
    case 'content_block_start':
      return <ContentBlockStart meta={meta} />;
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

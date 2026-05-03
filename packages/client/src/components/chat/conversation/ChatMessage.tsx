import { Component, type ErrorInfo, memo, type ReactNode } from 'react';
import type { ForkFn, Message, RewindFn } from '@/types/ui';
import { basename } from '@/utils/basename';
import { cn } from '@/utils/cn';
import { TruncatedContent } from '../renderers/TruncatedContent.tsx';
import { CopyButton, HOVER_COPY_BASE } from '../tool-use/message-blocks/CopyButton.tsx';
import { MessageActions } from './MessageActions.tsx';
import { renderBody } from './MessageContent.tsx';

class ContentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error rendering content:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-danger bg-danger-bg rounded px-3 py-2 border border-danger/20">
          Error rendering content: {this.state.error?.message ?? 'Unknown'}
        </div>
      );
    }
    return this.props.children;
  }
}

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

interface ChatMessageProps {
  message: Message;
  showAvatar?: boolean;
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

export const ChatMessage: React.MemoExoticComponent<
  (props: ChatMessageProps) => React.JSX.Element
> = memo(function ChatMessage({
  message,
  showAvatar = true,
  onRewind,
  onFork,
  onDiffRespond,
}: ChatMessageProps): React.JSX.Element {
  const isUser = message.role === 'user';

  if (isUser) {
    const userSource = message.type === 'text' ? (message.meta?.source ?? 'typed') : 'typed';
    const preserveWhitespace = userSource === 'typed';
    return (
      <div
        className="group text-sm py-1 relative"
        data-role={message.role}
        data-type={message.type}
      >
        <div
          className={`bg-surface rounded-lg px-4 py-3 break-words select-text leading-relaxed ${preserveWhitespace ? 'whitespace-pre-wrap' : ''}`}
        >
          <ContentErrorBoundary>
            {message.type === 'text' ? (
              <TruncatedContent maxHeight={600}>
                {renderBody(message, onDiffRespond)}
              </TruncatedContent>
            ) : (
              renderBody(message, onDiffRespond)
            )}
          </ContentErrorBoundary>
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

  return <AssistantMessage message={message} onDiffRespond={onDiffRespond} />;
});

function AssistantMessage({
  message,
  onDiffRespond,
}: {
  message: Message;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}) {
  const body = renderBody(message, onDiffRespond);
  // Opus 4.7 returns signature-only thinking unless `--thinking-display summarized`,
  // and historical sessions are empty-body forever. Skip the whole row in that case.
  if (body == null) return null;

  const showCopy = message.role !== 'system' && !NO_COPY_TYPES.has(message.type);
  return (
    <div className="group text-sm relative" data-role={message.role} data-type={message.type}>
      <div className="min-w-0" data-type={message.type === 'text' ? 'text' : undefined}>
        {message.type === 'text' ? (
          <div className="leading-relaxed">
            <TruncatedContent maxHeight={600}>
              <ContentErrorBoundary>{body}</ContentErrorBoundary>
            </TruncatedContent>
          </div>
        ) : (
          body
        )}
      </div>
      {showCopy && (
        <CopyButton
          aria-label="message-copy"
          text={message.content}
          className={cn(HOVER_COPY_BASE, 'absolute top-1 right-1 group-hover:opacity-100')}
          title="Copy"
        />
      )}
    </div>
  );
}

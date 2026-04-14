import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { ForkFn, Message, RewindFn } from '../types/ui';
import { MessageActions } from './MessageActions';
import { renderBody } from './MessageContent';
import { TruncatedContent } from './TruncatedContent';

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

interface ChatMessageProps {
  message: Message;
  showAvatar?: boolean;
  onRewind?: RewindFn;
  onFork?: ForkFn;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

export function ChatMessage({
  message,
  showAvatar = true,
  onRewind,
  onFork,
  onDiffRespond,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="group text-sm py-1" data-role={message.role} data-type={message.type}>
        <div className="bg-surface rounded-lg px-4 py-3 break-words whitespace-pre-wrap select-text leading-relaxed">
          <ContentErrorBoundary>{renderBody(message, onDiffRespond)}</ContentErrorBoundary>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.attachments.map((att) => {
              const basename = att.filename.split('/').pop() ?? att.filename;
              const range =
                att.startLine != null
                  ? `:${att.startLine}${att.endLine != null ? `-${att.endLine}` : ''}`
                  : '';
              return (
                <span
                  key={`${att.filename}-${att.startLine}`}
                  className="inline-flex items-center gap-1 text-xs text-text-muted bg-white/5 border border-border/50 rounded px-2 py-0.5"
                >
                  {basename}
                  {range}
                </span>
              );
            })}
          </div>
        )}
        {showAvatar && onRewind && (
          <MessageActions
            cliUuid={message.cliUuid}
            messageRole={message.role}
            messageContent={message.content}
            onRewind={onRewind}
            onFork={onFork}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="group leading-relaxed text-sm py-1"
      data-role={message.role}
      data-type={message.type}
    >
      <div className="min-w-0" data-type={message.type === 'text' ? 'text' : undefined}>
        {message.type === 'text' ? (
          <TruncatedContent maxHeight={600}>
            <ContentErrorBoundary>{renderBody(message, onDiffRespond)}</ContentErrorBoundary>
          </TruncatedContent>
        ) : (
          renderBody(message, onDiffRespond)
        )}
      </div>
    </div>
  );
}

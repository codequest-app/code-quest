import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types/ui';

interface ChatMessageProps {
  message: Message;
  showAvatar?: boolean;
}

const roleConfig = {
  user: { label: 'You', icon: '👤', bgClass: 'bg-user/20', textClass: 'text-user' },
  assistant: {
    label: 'Assistant',
    icon: '✦',
    bgClass: 'bg-assistant/20',
    textClass: 'text-assistant',
  },
  system: { label: 'System', icon: '⚙', bgClass: 'bg-text-muted/20', textClass: 'text-text-muted' },
};

function CollapsibleBlock({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer select-none text-sm text-text-muted hover:text-text transition-colors py-1">
        <span>{icon}</span>
        <span>{label}</span>
        <span className="text-xs opacity-50 group-open:rotate-90 transition-transform">▶</span>
      </summary>
      <div className="mt-2 pl-6">{children}</div>
    </details>
  );
}

function TextContent({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? '');
          const code = String(children).replace(/\n$/, '');
          if (match) {
            return (
              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
                {code}
              </SyntaxHighlighter>
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </Markdown>
  );
}

function ThinkingContent({ content }: { content: string }) {
  return (
    <CollapsibleBlock icon="💭" label="Thought">
      <p className="text-sm text-text-muted italic">{content}</p>
    </CollapsibleBlock>
  );
}

function ToolUseContent({ content, meta }: { content: string; meta?: Record<string, unknown> }) {
  const input = meta?.input;
  return (
    <CollapsibleBlock icon="⚙" label={content}>
      {input != null && (
        <pre className="bg-code-block p-3 rounded-lg overflow-x-auto text-[13px] font-mono border border-border">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </CollapsibleBlock>
  );
}

function ToolResultContent({ content }: { content: string }) {
  return (
    <CollapsibleBlock icon="✓" label="Result">
      <pre className="bg-code-block p-3 rounded-lg overflow-x-auto text-[13px] font-mono border border-border">
        {content}
      </pre>
    </CollapsibleBlock>
  );
}

function ControlRequestContent({ content }: { content: string }) {
  return (
    <div className="bg-warning-bg border-l-2 border-l-warning px-4 py-2.5 rounded-r-lg">
      <strong className="text-warning text-sm">⚠ Tool Approval: {content}</strong>
    </div>
  );
}

function ErrorContent({ content }: { content: string }) {
  return (
    <div
      className="text-danger bg-danger-bg rounded-lg px-4 py-3 border border-danger/20"
      data-type="error"
    >
      {content}
    </div>
  );
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const config = roleConfig[message.role] ?? roleConfig.system;

  let body: React.ReactNode;
  switch (message.type) {
    case 'text':
      body = <TextContent content={message.content} />;
      break;
    case 'thinking':
      body = <ThinkingContent content={message.content} />;
      break;
    case 'tool_use':
      body = <ToolUseContent content={message.content} meta={message.meta} />;
      break;
    case 'tool_result':
      body = <ToolResultContent content={message.content} />;
      break;
    case 'error':
      body = <ErrorContent content={message.content} />;
      break;
    case 'control_request':
      body = <ControlRequestContent content={message.content} />;
      break;
    default:
      body = <p>{message.content}</p>;
  }

  const avatarColWidth = 'w-7';

  return (
    <div className="leading-relaxed text-sm" data-role={message.role} data-type={message.type}>
      {showAvatar ? (
        <div className="flex gap-3">
          <div className={`${avatarColWidth} shrink-0 pt-0.5`}>
            <div
              className={`w-7 h-7 rounded-md ${config.bgClass} flex items-center justify-center text-sm`}
            >
              {config.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-semibold ${config.textClass}`}>{config.label}</span>
            <div className="mt-1" data-type={message.type === 'text' ? 'text' : undefined}>
              {body}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className={`${avatarColWidth} shrink-0`} />
          <div className="flex-1 min-w-0" data-type={message.type === 'text' ? 'text' : undefined}>
            {body}
          </div>
        </div>
      )}
    </div>
  );
}

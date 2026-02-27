import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types/ui';

interface ChatMessageProps {
  message: Message;
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
    <details className="chat-message__thinking">
      <summary>Thinking</summary>
      <p>{content}</p>
    </details>
  );
}

function ToolUseContent({ content, meta }: { content: string; meta?: Record<string, unknown> }) {
  const input = meta?.input;
  return (
    <div className="chat-message__tool-use">
      <strong>🔧 {content}</strong>
      {input != null && <pre>{JSON.stringify(input, null, 2)}</pre>}
    </div>
  );
}

function ToolResultContent({ content }: { content: string }) {
  return (
    <div className="chat-message__tool-result">
      <pre>{content}</pre>
    </div>
  );
}

function ControlRequestContent({ content }: { content: string }) {
  return (
    <div className="chat-message__control-request">
      <strong>⚠️ Tool Approval: {content}</strong>
    </div>
  );
}

function ErrorContent({ content }: { content: string }) {
  return <div className="chat-message--error">{content}</div>;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const roleClass = `chat-message--${message.role}`;
  const typeClass = `chat-message--${message.type}`;

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

  return <div className={`chat-message ${roleClass} ${typeClass}`}>{body}</div>;
}

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
    <details className="text-gray-500 italic">
      <summary className="cursor-pointer select-none">Thinking</summary>
      <p>{content}</p>
    </details>
  );
}

function ToolUseContent({ content, meta }: { content: string; meta?: Record<string, unknown> }) {
  const input = meta?.input;
  return (
    <div className="bg-[#1a2332] border-l-[3px] border-l-[#4a9eff] px-3 py-2 rounded-r">
      <strong>🔧 {content}</strong>
      {input != null && (
        <pre className="bg-[#111] p-2 rounded mt-1 overflow-x-auto text-[13px] font-mono">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ToolResultContent({ content }: { content: string }) {
  return (
    <div className="border-l-[3px] border-l-gray-600 pl-3">
      <pre className="bg-[#111] p-2 rounded overflow-x-auto text-[13px] font-mono">{content}</pre>
    </div>
  );
}

function ControlRequestContent({ content }: { content: string }) {
  return (
    <div className="bg-[#332b00] border-l-[3px] border-l-[#ffaa00] px-3 py-2 rounded-r">
      <strong>⚠️ Tool Approval: {content}</strong>
    </div>
  );
}

function ErrorContent({ content }: { content: string }) {
  return (
    <div className="text-red-400 bg-[#2d1b1b] rounded px-3 py-2" data-type="error">
      {content}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const roleStyles: Record<string, string> = {
    user: 'bg-[#2a2d3e] rounded-lg px-3 py-2',
    assistant: 'py-1',
    system: '',
  };

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

  return (
    <div
      className={`mb-3 leading-relaxed ${roleStyles[message.role] ?? ''}`}
      data-role={message.role}
      data-type={message.type}
    >
      {body}
    </div>
  );
}

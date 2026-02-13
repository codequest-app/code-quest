import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../../types';
import { StatsBar } from './StatsBar';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolUseBlock } from './ToolUseBlock';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
      data-testid={`message-${message.role}`}
    >
      <div className="message-header">
        <span className="message-role">{isUser ? 'You' : 'Assistant'}</span>
      </div>

      {message.thinking && <ThinkingBlock content={message.thinking} />}

      {message.toolUse?.map((tool) => (
        <ToolUseBlock key={tool.id} name={tool.name} input={tool.input} />
      ))}

      {message.toolResult?.map((result, i) => (
        <div
          key={`tool-result-${result.name}-${i}`}
          className="tool-result"
          data-testid="tool-result"
        >
          <span className="tool-result-label">{result.name}:</span>
          <pre>{result.output}</pre>
        </div>
      ))}

      <div className="message-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = !match;
              return inline ? (
                <code className={className} {...props}>
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {message.isStreaming && <span className="streaming-indicator">●</span>}

      {message.stats && <StatsBar stats={message.stats} />}

      <style>{`
        .message-bubble {
          padding: 12px 16px;
          margin: 4px 0;
          border-radius: 8px;
        }
        .message-bubble.user {
          background: #264f78;
          margin-left: 48px;
        }
        .message-bubble.assistant {
          background: #2d2d30;
          margin-right: 48px;
        }
        .message-header {
          margin-bottom: 4px;
        }
        .message-role {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
        }
        .message-content {
          color: #d4d4d4;
          font-size: 14px;
          line-height: 1.5;
        }
        .message-content p {
          margin: 4px 0;
        }
        .message-content pre {
          background: #1e1e1e;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
        }
        .message-content code {
          background: #1e1e1e;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 13px;
        }
        .streaming-indicator {
          color: #007acc;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .tool-result {
          background: #1a1a2e;
          padding: 8px;
          border-radius: 4px;
          margin: 4px 0;
          font-size: 12px;
        }
        .tool-result-label {
          color: #888;
          font-weight: 600;
        }
        .tool-result pre {
          margin: 4px 0 0 0;
          white-space: pre-wrap;
          color: #aaa;
        }
      `}</style>
    </div>
  );
}

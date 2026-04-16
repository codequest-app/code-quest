import type { ToolUseMeta } from '../../types/ui';
import { cn } from '../../utils/cn';
import { isDiff } from '../../utils/diff';
import { langFromPath } from '../../utils/syntax';
import { CodeBlock } from '../CodeBlock';
import { DiffViewer } from '../DiffViewer';
import { getToolHeaderInfo } from '../tools/tool-registry';
import {
  AnsiContent,
  CODE_BLOCK_CLASS,
  CollapsibleBlock,
  hasAnsi,
  parseFilePathsInContent,
} from './shared';

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="text-[10px] text-text-muted hover:text-text opacity-0 group-hover/tool:opacity-100 transition-opacity ml-auto flex-shrink-0"
      title="Copy"
    >
      📋
    </button>
  );
}

function ToolBodyRow({
  label,
  children,
  copyText,
}: {
  label: string;
  children: React.ReactNode;
  copyText?: string;
}) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-[10px] font-mono text-text-muted/60 w-6 flex-shrink-0 pt-0.5 select-none">
        {label}
      </span>
      <div className="flex-1 min-w-0 overflow-x-auto">{children}</div>
      {copyText && <CopyButton text={copyText} />}
    </div>
  );
}

function ToolErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-danger/10 border-l-2 border-danger px-3 py-1.5 rounded-r text-xs text-danger mb-1">
      {message}
    </div>
  );
}

function BashToolBody({
  input,
  resultContent,
  resultIsError,
}: {
  input: Record<string, unknown>;
  resultContent?: string;
  resultIsError?: boolean;
}) {
  const command = String(input.command ?? '');
  return (
    <div className="flex flex-col gap-1.5">
      <ToolBodyRow label="IN" copyText={command}>
        <pre className={CODE_BLOCK_CLASS}>{command}</pre>
      </ToolBodyRow>
      {resultContent != null && (
        <ToolBodyRow label="OUT" copyText={resultContent}>
          {hasAnsi(resultContent) ? (
            <div className={cn(resultIsError && 'text-danger')}>
              <AnsiContent content={resultContent} />
            </div>
          ) : (
            <pre className={cn(CODE_BLOCK_CLASS, resultIsError && 'text-danger')}>
              {parseFilePathsInContent(resultContent)}
            </pre>
          )}
        </ToolBodyRow>
      )}
    </div>
  );
}

function FileToolBody({
  resultContent,
  resultIsError,
}: {
  resultContent?: string;
  resultIsError?: boolean;
}) {
  if (!resultContent) return null;
  return (
    <div className={cn(resultIsError && 'text-danger')}>
      {isDiff(resultContent) ? (
        <DiffViewer content={resultContent} />
      ) : (
        <pre className={CODE_BLOCK_CLASS}>{parseFilePathsInContent(resultContent)}</pre>
      )}
    </div>
  );
}

function DefaultToolBody({
  input,
  resultContent,
  resultIsError,
  partialInput,
}: {
  input: Record<string, unknown>;
  resultContent?: string;
  resultIsError?: boolean;
  partialInput?: string;
}) {
  const inputJson = Object.keys(input).length > 0 ? JSON.stringify(input, null, 2) : null;

  return (
    <div className="flex flex-col gap-1.5">
      {partialInput ? (
        <pre className={cn(CODE_BLOCK_CLASS, 'text-text-muted/80 animate-pulse')}>
          {partialInput}
        </pre>
      ) : inputJson ? (
        <ToolBodyRow label="IN" copyText={inputJson}>
          <pre className={CODE_BLOCK_CLASS}>{inputJson}</pre>
        </ToolBodyRow>
      ) : null}
      {resultContent != null && (
        <ToolBodyRow label="OUT" copyText={resultContent}>
          <div className={cn(resultIsError && 'text-danger')}>
            {isDiff(resultContent) ? (
              <DiffViewer content={resultContent} />
            ) : hasAnsi(resultContent) ? (
              <AnsiContent content={resultContent} />
            ) : (
              <pre className={CODE_BLOCK_CLASS}>{parseFilePathsInContent(resultContent)}</pre>
            )}
          </div>
        </ToolBodyRow>
      )}
    </div>
  );
}

export function ToolUseBlock({ content, meta }: { content: string; meta?: ToolUseMeta }) {
  const toolName = content;
  const input = meta?.input ?? {};
  const partialInput = meta?.partialInput;
  const result = meta?.result;
  const resultContent = result?.content;
  const resultIsError = result?.is_error;

  const headerInfo = getToolHeaderInfo(toolName, input);
  const renderBody = () => {
    switch (toolName) {
      case 'Bash':
        return (
          <BashToolBody input={input} resultContent={resultContent} resultIsError={resultIsError} />
        );
      case 'Read': {
        if (!resultContent) return null;
        const filePath = String(input.file_path ?? '');
        const lang = langFromPath(filePath);
        return <CodeBlock code={resultContent} language={lang} />;
      }
      case 'Write':
      case 'Edit':
      case 'MultiEdit':
        if (partialInput)
          return (
            <pre className={cn(CODE_BLOCK_CLASS, 'text-text-muted/80 animate-pulse')}>
              {partialInput}
            </pre>
          );
        return <FileToolBody resultContent={resultContent} resultIsError={resultIsError} />;
      default:
        return (
          <DefaultToolBody
            input={input}
            resultContent={resultContent}
            resultIsError={resultIsError}
            partialInput={partialInput}
          />
        );
    }
  };

  return (
    <div className="group/tool">
      <CollapsibleBlock
        icon="⚙"
        label={headerInfo.name}
        labelDetail={headerInfo.detail}
        labelRange={headerInfo.range}
      >
        {resultIsError && resultContent && <ToolErrorBanner message={resultContent} />}
        {renderBody()}
        {!partialInput && !result && (
          <div className="text-xs text-text-muted/50 animate-pulse mt-1">Running...</div>
        )}
      </CollapsibleBlock>
    </div>
  );
}

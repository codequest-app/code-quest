import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Copyable } from '@/components/chat/renderers/Copyable';
import { DiffViewer } from '@/components/chat/renderers/DiffViewer';
import { Highlight } from '@/components/chat/renderers/Highlight';
import { Labeled } from '@/components/chat/renderers/Labeled';
import { MarkdownContent } from '@/components/chat/renderers/MarkdownContent';
import { cn } from '@/utils/cn';
import { generateUnifiedDiff } from '@/utils/diff';
import { CODE_BLOCK_CLASS } from '../renderers/primitives.tsx';
import { AlertBanner } from './AlertBanner.tsx';
import { ContentRenderer } from './ContentRenderer.tsx';
import { ToolBlock } from './ToolBlock.tsx';

function PartialInputPlaceholder({ content }: { content: string }) {
  return <pre className={cn(CODE_BLOCK_CLASS, 'text-text-muted/60 animate-pulse')}>{content}</pre>;
}

function ToolErrorBanner({ message }: { message: string }) {
  return (
    <AlertBanner className="bg-danger/10 border-danger px-3 py-1.5 text-xs text-danger mb-1">
      {message}
    </AlertBanner>
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
    <ToolBlock>
      <Labeled label="IN" divider={resultContent != null}>
        <Copyable text={command}>
          <Highlight lang="bash">{command}</Highlight>
        </Copyable>
      </Labeled>
      {resultContent != null && (
        <Labeled label="OUT">
          <Copyable text={resultContent}>
            <ContentRenderer content={resultContent} isError={resultIsError} bare />
          </Copyable>
        </Labeled>
      )}
    </ToolBlock>
  );
}

function WriteToolBody({
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
  if (partialInput) return <PartialInputPlaceholder content={partialInput} />;
  const filePath = typeof input.file_path === 'string' ? input.file_path : '';
  const content = typeof input.content === 'string' ? input.content : null;
  return (
    <ToolBlock>
      {content != null && (
        <Labeled label="IN" divider={resultContent != null}>
          <Copyable text={content}>
            <Highlight filePath={filePath}>{content}</Highlight>
          </Copyable>
        </Labeled>
      )}
      {resultContent != null && (
        <Labeled label="OUT">
          <ContentRenderer content={resultContent} isError={resultIsError} bare />
        </Labeled>
      )}
    </ToolBlock>
  );
}

function tryParsePartialInput(
  partialInput: string,
): { file_path?: string; old_string?: string; new_string?: string } | null {
  try {
    const parsed: unknown = JSON.parse(partialInput);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, string>;
  } catch {}
  return null;
}

function EditStreamingPreview({ partialInput }: { partialInput: string }) {
  const parsed = tryParsePartialInput(partialInput);
  if (parsed?.old_string != null || parsed?.new_string != null) {
    const filePath = parsed.file_path ?? 'file';
    return (
      <DiffViewer
        content={generateUnifiedDiff(parsed.old_string ?? '', parsed.new_string ?? '', filePath)}
      />
    );
  }
  return (
    <div className="flex items-center gap-2 py-2 text-xs text-text-muted/60 animate-pulse">
      <PencilSquareIcon className="w-4 h-4" />
      <span>Editing…</span>
    </div>
  );
}

function EditToolBody({
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
  const hasCompleteInput = Object.keys(input).length > 0;

  if (partialInput && !hasCompleteInput) {
    return <EditStreamingPreview partialInput={partialInput} />;
  }

  const filePath = typeof input.file_path === 'string' ? input.file_path : 'file';
  const oldStr = typeof input.old_string === 'string' ? input.old_string : null;
  const newStr = typeof input.new_string === 'string' ? input.new_string : null;

  if (oldStr == null && newStr == null) {
    if (!resultContent) return null;
    return <ContentRenderer content={resultContent} isError={resultIsError} bare />;
  }

  return <DiffViewer content={generateUnifiedDiff(oldStr ?? '', newStr ?? '', filePath)} />;
}

function SkillToolBody({
  input,
  resultContent,
  hasResult,
}: {
  input: Record<string, unknown>;
  resultContent?: string;
  hasResult: boolean;
}) {
  const skillName = typeof input.skill === 'string' ? input.skill : undefined;
  return (
    <ToolBlock>
      {skillName && (
        <Labeled label="SKILL" divider={hasResult}>
          <Copyable text={skillName}>
            <span>{skillName}</span>
          </Copyable>
        </Labeled>
      )}
      {resultContent != null && (
        <Labeled label="OUT">
          <Copyable text={resultContent}>
            <MarkdownContent content={resultContent} />
          </Copyable>
        </Labeled>
      )}
    </ToolBlock>
  );
}

function DefaultToolBody({
  input,
  resultContent,
  resultIsError,
  partialInput,
  taskType,
}: {
  input: Record<string, unknown>;
  resultContent?: string;
  resultIsError?: boolean;
  partialInput?: string;
  taskType?: string;
}) {
  if (partialInput) {
    return <PartialInputPlaceholder content={partialInput} />;
  }

  const inputJson = Object.keys(input).length > 0 ? JSON.stringify(input, null, 2) : null;
  if (!inputJson && resultContent == null) return null;

  return (
    <ToolBlock>
      {inputJson && (
        <Labeled label="IN" divider={resultContent != null}>
          <Copyable text={inputJson}>
            <Highlight>{inputJson}</Highlight>
          </Copyable>
        </Labeled>
      )}
      {resultContent != null && (
        <Labeled label="OUT">
          {taskType === 'local_agent' || taskType === 'subagent' ? (
            <MarkdownContent content={resultContent} />
          ) : (
            <Copyable text={resultContent}>
              <ContentRenderer content={resultContent} isError={resultIsError} bare />
            </Copyable>
          )}
        </Labeled>
      )}
    </ToolBlock>
  );
}

function ToolBody({
  toolName,
  input,
  result,
  partialInput,
  taskType,
}: {
  toolName: string;
  input: Record<string, unknown>;
  result?: { content?: string; is_error?: boolean };
  partialInput?: string;
  taskType?: string;
}): React.JSX.Element | null {
  const resultContent = result?.content;
  const resultIsError = result?.is_error;
  switch (toolName) {
    case 'Bash':
      return (
        <BashToolBody input={input} resultContent={resultContent} resultIsError={resultIsError} />
      );
    case 'Read':
      if (!resultContent) return null;
      return (
        <Copyable text={resultContent}>
          <Highlight filePath={String(input.file_path ?? '')}>{resultContent}</Highlight>
        </Copyable>
      );
    case 'Write':
      return (
        <WriteToolBody
          input={input}
          resultContent={resultContent}
          resultIsError={resultIsError}
          partialInput={partialInput}
        />
      );
    case 'Edit':
    case 'MultiEdit':
      return (
        <EditToolBody
          input={input}
          resultContent={resultContent}
          resultIsError={resultIsError}
          partialInput={partialInput}
        />
      );
    case 'Skill':
      return (
        <SkillToolBody input={input} resultContent={resultContent} hasResult={result != null} />
      );
    default:
      return (
        <DefaultToolBody
          input={input}
          resultContent={resultContent}
          resultIsError={resultIsError}
          partialInput={partialInput}
          taskType={taskType}
        />
      );
  }
}

export function ToolUseBlock({
  toolName,
  input = {},
  result,
  partialInput,
  taskType,
}: {
  toolName: string;
  input?: Record<string, unknown>;
  result?: { content?: string; is_error?: boolean };
  partialInput?: string;
  taskType?: string;
}): React.JSX.Element {
  return (
    <>
      {result?.is_error && result.content && <ToolErrorBanner message={result.content} />}
      <ToolBody
        toolName={toolName}
        input={input}
        result={result}
        partialInput={partialInput}
        taskType={taskType}
      />
      {!partialInput && !result && (
        <div className="text-xs text-text-muted/60 animate-pulse mt-1">Running...</div>
      )}
    </>
  );
}

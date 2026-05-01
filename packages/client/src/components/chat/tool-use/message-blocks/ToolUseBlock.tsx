import type { TokenUsage } from '@code-quest/shared';
import type { ToolUseMeta } from '../../../../types/ui';
import { cn } from '../../../../utils/cn';
import { langFromPath } from '../../../../utils/syntax';
import { getToolHeaderInfo } from '../../../../utils/tool-registry';
import { CodeBlock } from '../../renderers/CodeBlock';
import { MarkdownContent } from '../../renderers/MarkdownContent';
import { AlertBanner } from './AlertBanner';
import { ContentRenderer } from './ContentRenderer';
import { CODE_BLOCK_CLASS, CollapsibleBlock, OutputContent } from './primitives';
import { ToolBlock, ToolBlockRow } from './ToolBlock';

function totalTokens(usage: TokenUsage): number | null {
  const total = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
  return total > 0 ? total : null;
}

function TaskStatusBadge({
  taskStatus,
  lastToolName,
  taskSummary,
  taskType,
  taskUsage,
}: {
  taskStatus?: string;
  lastToolName?: string;
  taskSummary?: string;
  taskType?: string;
  taskUsage?: TokenUsage;
}): React.JSX.Element | null {
  if (!taskStatus) return null;

  if (taskStatus === 'running') {
    return (
      <span className="flex items-center gap-1 text-xs text-accent animate-pulse">
        <span>●</span>
        <span>Running{lastToolName ? ` · ${lastToolName}` : ''}</span>
        {taskType === 'local_agent' && <span className="opacity-60">[local]</span>}
      </span>
    );
  }
  if (taskStatus === 'failed') {
    return <span className="text-xs text-danger">✗ Failed</span>;
  }
  const tokens = taskUsage ? totalTokens(taskUsage) : null;
  return (
    <span className="text-xs text-success">
      ✓ Done{taskSummary ? ` · ${taskSummary}` : ''}
      {tokens != null && <span className="opacity-60 ml-1">({tokens.toLocaleString()} tok)</span>}
    </span>
  );
}

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
      <ToolBlockRow label="IN" copyText={command} divider={resultContent != null}>
        <pre className="whitespace-pre-wrap">{command}</pre>
      </ToolBlockRow>
      {resultContent != null && (
        <ToolBlockRow label="OUT">
          <OutputContent content={resultContent} isError={resultIsError} />
        </ToolBlockRow>
      )}
    </ToolBlock>
  );
}

function ReadToolBody({
  input,
  resultContent,
}: {
  input: Record<string, unknown>;
  resultContent?: string;
}) {
  if (!resultContent) return null;
  const filePath = String(input.file_path ?? '');
  const lang = langFromPath(filePath);
  return <CodeBlock code={resultContent} language={lang} />;
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
      <ContentRenderer content={resultContent} />
    </div>
  );
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
        <ToolBlockRow label="SKILL" copyText={skillName} divider={hasResult}>
          <span>{skillName}</span>
        </ToolBlockRow>
      )}
      {resultContent != null && (
        <ToolBlockRow label="OUT">
          <MarkdownContent content={resultContent} />
        </ToolBlockRow>
      )}
    </ToolBlock>
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

  if (partialInput) {
    return <PartialInputPlaceholder content={partialInput} />;
  }

  if (!inputJson && resultContent == null) return null;

  return (
    <ToolBlock>
      {inputJson && (
        <ToolBlockRow label="IN" copyText={inputJson} divider={resultContent != null}>
          <pre className="whitespace-pre-wrap">{inputJson}</pre>
        </ToolBlockRow>
      )}
      {resultContent != null && (
        <ToolBlockRow label="OUT">
          <OutputContent content={resultContent} isError={resultIsError} />
        </ToolBlockRow>
      )}
    </ToolBlock>
  );
}

function ToolBody({
  toolName,
  input,
  result,
  partialInput,
}: {
  toolName: string;
  input: Record<string, unknown>;
  result: ToolUseMeta['result'];
  partialInput?: string;
}): React.JSX.Element | null {
  const resultContent = result?.content;
  const resultIsError = result?.is_error;
  switch (toolName) {
    case 'Bash':
      return (
        <BashToolBody input={input} resultContent={resultContent} resultIsError={resultIsError} />
      );
    case 'Read':
      return <ReadToolBody input={input} resultContent={resultContent} />;
    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      if (partialInput) return <PartialInputPlaceholder content={partialInput} />;
      return <FileToolBody resultContent={resultContent} resultIsError={resultIsError} />;
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
        />
      );
  }
}

export function ToolUseBlock({
  content,
  meta,
}: {
  content: string;
  meta?: ToolUseMeta;
}): React.JSX.Element {
  const toolName = content;
  const input = meta?.input ?? {};
  const partialInput = meta?.partialInput;
  const result = meta?.result;

  const headerInfo = getToolHeaderInfo(toolName, input);
  const isTaskTool = toolName === 'Task' || toolName === 'Agent';
  const subagentType =
    isTaskTool && typeof input.subagent_type === 'string' ? input.subagent_type : undefined;
  const taskBadge = isTaskTool ? (
    <span className="flex items-center gap-1.5">
      {subagentType && (
        <span className="text-xs text-text-muted/60 font-mono">[{subagentType}]</span>
      )}
      <TaskStatusBadge
        taskStatus={meta?.taskStatus}
        lastToolName={meta?.lastToolName}
        taskSummary={meta?.taskSummary}
        taskType={meta?.taskType}
        taskUsage={meta?.taskUsage}
      />
    </span>
  ) : undefined;

  return (
    <div className="group/tool">
      <CollapsibleBlock
        icon="⚙"
        label={headerInfo.name}
        labelDetail={headerInfo.detail}
        labelRange={headerInfo.range}
        labelSuffix={taskBadge}
      >
        {result?.is_error && result.content && <ToolErrorBanner message={result.content} />}
        <ToolBody toolName={toolName} input={input} result={result} partialInput={partialInput} />
        {!partialInput && !result && (
          <div className="text-xs text-text-muted/60 animate-pulse mt-1">Running...</div>
        )}
      </CollapsibleBlock>
    </div>
  );
}

import type { TokenUsage, ToolUseMeta } from '@code-quest/shared';
import {
  CommandLineIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ServerIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';
import { CodeBlock } from '@/components/chat/renderers/CodeBlock';
import { MarkdownContent } from '@/components/chat/renderers/MarkdownContent';
import { cn } from '@/utils/cn';
import { langFromPath } from '@/utils/lang-from-path';
import { AGENT_TOOLS, getToolHeaderInfo, isMcpTool } from '@/utils/tool-utils';
import { AlertBanner } from './AlertBanner.tsx';
import { ContentRenderer } from './ContentRenderer.tsx';
import { CODE_BLOCK_CLASS, CollapsibleBlock, OutputContent } from './primitives.tsx';
import { ToolBlock, ToolBlockRow } from './ToolBlock.tsx';

const TOOL_ICON_CLASS = 'w-4 h-4 shrink-0';

function getToolIcon(toolName: string): React.ReactNode {
  if (toolName === 'Bash') return <CommandLineIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Read') return <DocumentMagnifyingGlassIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Write') return <DocumentPlusIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Edit' || toolName === 'MultiEdit')
    return <PencilSquareIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'WebSearch') return <MagnifyingGlassIcon className={TOOL_ICON_CLASS} />;
  if (toolName === 'Agent' || toolName === 'Task')
    return <CpuChipIcon className={TOOL_ICON_CLASS} />;
  if (isMcpTool(toolName)) return <ServerIcon className={TOOL_ICON_CLASS} />;
  return <WrenchIcon className={TOOL_ICON_CLASS} />;
}

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
  taskStatus?: ToolUseMeta['taskStatus'];
  lastToolName?: string;
  taskSummary?: string;
  taskType?: ToolUseMeta['taskType'];
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
  if (partialInput) {
    return <PartialInputPlaceholder content={partialInput} />;
  }

  const inputJson = Object.keys(input).length > 0 ? JSON.stringify(input, null, 2) : null;
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

function TaskBadge({
  toolName,
  input,
  meta,
}: {
  toolName: string;
  input: Record<string, unknown>;
  meta?: ToolUseMeta;
}): React.JSX.Element | null {
  if (!AGENT_TOOLS.has(toolName)) return null;
  const subagentType = typeof input.subagent_type === 'string' ? input.subagent_type : undefined;
  if (!subagentType && !meta?.taskStatus) return null;
  return (
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
  );
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

  return (
    <CollapsibleBlock
      icon={getToolIcon(toolName)}
      label={headerInfo.name}
      labelDetail={headerInfo.detail}
      labelRange={headerInfo.range}
      labelSuffix={
        AGENT_TOOLS.has(toolName) ? (
          <TaskBadge toolName={toolName} input={input} meta={meta} />
        ) : undefined
      }
    >
      {result?.is_error && result.content && <ToolErrorBanner message={result.content} />}
      <ToolBody toolName={toolName} input={input} result={result} partialInput={partialInput} />
      {!partialInput && !result && (
        <div className="text-xs text-text-muted/60 animate-pulse mt-1">Running...</div>
      )}
    </CollapsibleBlock>
  );
}

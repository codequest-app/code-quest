import type { ToolUseMeta } from '../../types/ui';
import { cn } from '../../utils/cn';
import { langFromPath } from '../../utils/syntax';
import { getToolHeaderInfo } from '../../utils/tool-registry';
import { CodeBlock } from '../CodeBlock';
import { MarkdownContent } from '../MarkdownContent';
import { AlertBanner } from './AlertBanner';
import { ContentRenderer } from './ContentRenderer';
import { CODE_BLOCK_CLASS, CollapsibleBlock, OutputContent } from './shared';
import { ToolBlock, ToolBlockRow } from './ToolBlock';

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
        <pre className="whitespace-pre">{command}</pre>
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
          <pre className="whitespace-pre">{inputJson}</pre>
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
  const resultContent = result?.content;
  const resultIsError = result?.is_error;

  const headerInfo = getToolHeaderInfo(toolName, input);
  const renderBody = () => {
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
          <div className="text-xs text-text-muted/60 animate-pulse mt-1">Running...</div>
        )}
      </CollapsibleBlock>
    </div>
  );
}

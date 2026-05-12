import type { AssistantTurn, Message } from '@/types/ui';
import { basename } from '@/utils/basename';

export const AGENT_TOOLS: Set<string> = new Set(['Task', 'Agent']);

function isToolUseMessage(message: Message): boolean {
  if (message.type === 'tool_use') return true;
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    return turn.blocks.length > 0 && turn.blocks.every((b) => b.type === 'tool_use');
  }
  return false;
}

function getToolUseMeta(message: Message):
  | {
      content: string;
      toolId?: string;
      input?: Record<string, unknown>;
      result?: { is_error?: boolean };
    }
  | undefined {
  if (message.type === 'tool_use') {
    return {
      content: message.content,
      toolId: message.toolId,
      input: message.input,
      result: message.result,
    };
  }
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    const toolBlock = turn.blocks.find((b) => b.type === 'tool_use');
    if (toolBlock) {
      return {
        content: toolBlock.content,
        toolId: toolBlock.toolId,
        input: toolBlock.input,
      };
    }
  }
  return undefined;
}

const MCP_PREFIX = 'mcp__';

export function isMcpTool(name: string): boolean {
  return name.startsWith(MCP_PREFIX);
}

export function parseMcpToolName(name: string): { server: string; tool: string } {
  const parts = name.slice(MCP_PREFIX.length).split('__');
  return { server: parts[0] ?? name, tool: parts.slice(1).join('__') || name };
}

type ToolInput = Record<string, unknown>;

interface ToolHeaderInfo {
  name: string;
  detail?: string;
  range?: string;
}

const MCP_SUMMARY_MAX_LENGTH = 60;
const AGENT_DESCRIPTION_MAX_LENGTH = 80;

function fileDetail(input: ToolInput): string | undefined {
  return input.file_path ? basename(String(input.file_path)) : undefined;
}

function lineRange(input: ToolInput): string | undefined {
  const offset = typeof input.offset === 'number' ? input.offset : undefined;
  const limit = typeof input.limit === 'number' ? input.limit : undefined;
  if (offset !== undefined && limit !== undefined) return `(lines ${offset + 1}-${offset + limit})`;
  if (offset !== undefined) return `(from line ${offset + 1})`;
  return undefined;
}

function bashSummary(command: string | undefined): string | undefined {
  if (!command) return undefined;
  const last = command.split('&&').pop()?.trim() ?? command;
  const clean = last.replace(/\s+2>&1.*$/, '').trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean;
}

function mcpHeader(toolName: string, input: ToolInput): ToolHeaderInfo {
  const { server, tool } = parseMcpToolName(toolName);
  const summary = input.query ?? input.command ?? input.message ?? '';
  return {
    name: `${server}::${tool}`,
    detail: summary ? String(summary).slice(0, MCP_SUMMARY_MAX_LENGTH) : undefined,
  };
}

export function getToolHeaderInfo(toolName: string, input: ToolInput): ToolHeaderInfo {
  switch (toolName) {
    case 'Bash': {
      const desc = input.description ? String(input.description) : undefined;
      const cmd = typeof input.command === 'string' ? input.command : undefined;
      return { name: 'Bash', detail: desc ?? bashSummary(cmd) };
    }
    case 'Read':
      return { name: 'Read', detail: fileDetail(input), range: lineRange(input) };
    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      return { name: toolName, detail: fileDetail(input) };
    case 'WebSearch':
      return { name: 'WebSearch', detail: input.query ? String(input.query) : undefined };
    case 'Agent':
    case 'Task':
      return {
        name: 'Agent',
        detail: String(input.description ?? input.prompt ?? 'task').slice(
          0,
          AGENT_DESCRIPTION_MAX_LENGTH,
        ),
      };
    default:
      return isMcpTool(toolName) ? mcpHeader(toolName, input) : { name: toolName };
  }
}

export type TimelineRun =
  | { kind: 'grouped'; messages: Message[] }
  | { kind: 'solo'; message: Message };

export interface GroupChip {
  label: string;
  count?: number;
  isError: boolean;
}

function flushPending(pending: Message[]): TimelineRun[] {
  if (pending.length === 0) return [];
  if (pending.length === 1 && pending[0]) return [{ kind: 'solo', message: pending[0] }];
  return [{ kind: 'grouped', messages: pending }];
}

export function splitTimelineRuns(messages: Message[]): TimelineRun[] {
  type Acc = { runs: TimelineRun[]; pending: Message[] };
  const { runs, pending } = messages.reduce<Acc>(
    ({ runs, pending }, message) => {
      if (isToolUseMessage(message)) return { runs, pending: [...pending, message] };
      return { runs: [...runs, ...flushPending(pending), { kind: 'solo', message }], pending: [] };
    },
    { runs: [], pending: [] },
  );
  return [...runs, ...flushPending(pending)];
}

function stringInput(
  input: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  return typeof input?.[key] === 'string' ? (input[key] as string) : fallback;
}

function skillChipLabel(skillName: string): string {
  const parts = skillName.split(':');
  const shortName = parts.length > 1 ? (parts[parts.length - 1] ?? skillName) : skillName;
  return `/${shortName}`;
}

export function buildGroupChips(messages: Message[]): GroupChip[] {
  const chips: GroupChip[] = [];
  const genericIndex = new Map<string, number>();

  for (const message of messages) {
    const toolInfo = getToolUseMeta(message);
    if (!toolInfo) continue;
    const toolName = toolInfo.content;
    const isError = toolInfo.result?.is_error === true;

    if (toolName === 'Skill') {
      const skillName = stringInput(toolInfo.input, 'skill', 'skill');
      chips.push({ label: skillChipLabel(skillName), isError });
    } else if (AGENT_TOOLS.has(toolName)) {
      const description = stringInput(toolInfo.input, 'description', 'Agent');
      chips.push({ label: description, isError });
    } else {
      const idx = genericIndex.get(toolName);
      if (idx !== undefined) {
        const chip = chips[idx];
        if (chip) {
          chip.count = (chip.count ?? 1) + 1;
          if (isError) chip.isError = true;
        }
      } else {
        genericIndex.set(toolName, chips.length);
        chips.push({ label: toolName, count: 1, isError });
      }
    }
  }

  return chips;
}

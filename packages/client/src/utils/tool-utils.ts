import { basename } from '@/utils/basename';
import type { MessageNode } from '@/utils/message-tree';

export const AGENT_TOOLS: Set<string> = new Set(['Task', 'Agent']);

const MCP_PREFIX = 'mcp__';

export function isMcpTool(name: string): boolean {
  return name.startsWith(MCP_PREFIX);
}

export function parseMcpToolName(name: string): { server: string; tool: string } {
  const parts = name.slice(MCP_PREFIX.length).split('__');
  return { server: parts[0] ?? name, tool: parts.slice(1).join('__') || name };
}

type ToolInput = Record<string, unknown>;

export interface ToolHeaderInfo {
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
    case 'Bash':
      return { name: 'Bash', detail: input.description ? String(input.description) : undefined };
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
  | { kind: 'grouped'; nodes: MessageNode[] }
  | { kind: 'solo'; node: MessageNode };

export interface GroupChip {
  label: string;
  count?: number;
  isError: boolean;
}

export function splitTimelineRuns(nodes: MessageNode[]): TimelineRun[] {
  const runs: TimelineRun[] = [];
  let pending: MessageNode[] = [];

  const flush = () => {
    if (pending.length === 0) return;
    if (pending.length === 1) {
      const node = pending[0];
      if (node) runs.push({ kind: 'solo', node });
    } else {
      runs.push({ kind: 'grouped', nodes: pending });
    }
    pending = [];
  };

  for (const node of nodes) {
    if (node.message.type === 'tool_use') {
      pending.push(node);
    } else {
      flush();
      runs.push({ kind: 'solo', node });
    }
  }
  flush();
  return runs;
}

function stringInput(
  input: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  return typeof input?.[key] === 'string' ? (input[key] as string) : fallback;
}

export function buildGroupChips(nodes: MessageNode[]): GroupChip[] {
  const chips: GroupChip[] = [];
  const genericIndex = new Map<string, number>();

  for (const node of nodes) {
    if (node.message.type !== 'tool_use') continue;
    const toolName = node.message.content;
    const meta = node.message.meta;
    const isError = meta.result?.is_error === true;

    if (toolName === 'Skill') {
      const skillName = stringInput(meta.input, 'skill', 'skill');
      const parts = skillName.split(':');
      const shortName = parts.length > 1 ? (parts[parts.length - 1] ?? skillName) : skillName;
      chips.push({ label: `/${shortName}`, isError });
    } else if (AGENT_TOOLS.has(toolName)) {
      const description = stringInput(meta.input, 'description', 'Agent');
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

import { basename } from '@/utils/basename';

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
    case 'Task': // Both display as "Agent" — Task is an internal alias
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

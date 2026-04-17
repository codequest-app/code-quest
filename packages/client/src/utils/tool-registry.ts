type ToolInput = Record<string, unknown>;

/** Structured header for rendering: name bold + detail secondary + optional range */
interface ToolHeaderInfo {
  /** Tool name shown in bold */
  name: string;
  /** Secondary detail (file basename, command excerpt, etc.) */
  detail?: string;
  /** Optional range text like "(lines 10-20)" */
  range?: string;
}

const MCP_PREFIX = 'mcp__';

/** Check if a tool name is an MCP tool (prefixed with mcp__) */
export function isMcpTool(name: string): boolean {
  return name.startsWith(MCP_PREFIX);
}

/** Parse MCP tool name into server + tool parts */
export function parseMcpToolName(name: string): { server: string; tool: string } {
  const parts = name.slice(MCP_PREFIX.length).split('__');
  return { server: parts[0] ?? name, tool: parts.slice(1).join('__') || name };
}

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

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
    detail: summary ? String(summary).slice(0, 60) : undefined,
  };
}

/** Get structured header info for a tool_use block */
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
        detail: String(input.description ?? input.prompt ?? 'task').slice(0, 80),
      };
    default:
      return isMcpTool(toolName) ? mcpHeader(toolName, input) : { name: toolName };
  }
}

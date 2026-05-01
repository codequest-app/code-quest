import type { MessageNode } from './message-tree';

export type TimelineRun =
  | { kind: 'grouped'; nodes: MessageNode[] }
  | { kind: 'solo'; node: MessageNode };

export interface GroupChip {
  label: string;
  count?: number;
  isError: boolean;
}

/**
 * Split nodes into timeline runs.
 * thinking and text act as boundaries — tool_use messages on either side
 * form separate groups. Every tool_use (even a single one) becomes a group.
 */
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

/**
 * Build summary chips for a group of tool_use nodes.
 * - Skill → "/<skill-name>"
 * - Task/Agent → description from meta or fallback "Agent"
 * - Generic tools → "<ToolName> ×N", aggregated by name
 */
function stringInput(
  input: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  return typeof input?.[key] === 'string' ? (input[key] as string) : fallback;
}

export function buildGroupChips(nodes: MessageNode[]): GroupChip[] {
  const genericCounts = new Map<string, { count: number; isError: boolean }>();
  const namedChips: GroupChip[] = [];

  for (const node of nodes) {
    if (node.message.type !== 'tool_use') continue;
    const toolName = node.message.content;
    const meta = node.message.meta;
    const isError = meta.result?.is_error === true;

    if (toolName === 'Skill') {
      const skillName = stringInput(meta.input, 'skill', 'skill');
      const parts = skillName.split(':');
      const shortName = parts.length > 1 ? (parts[parts.length - 1] ?? skillName) : skillName;
      namedChips.push({ label: `/${shortName}`, isError });
    } else if (toolName === 'Task' || toolName === 'Agent') {
      const description = stringInput(meta.input, 'description', 'Agent');
      namedChips.push({ label: description, isError });
    } else {
      const entry = genericCounts.get(toolName);
      if (entry) {
        entry.count += 1;
        if (isError) entry.isError = true;
      } else {
        genericCounts.set(toolName, { count: 1, isError });
      }
    }
  }

  const genericChips: GroupChip[] = Array.from(genericCounts.entries()).map(
    ([name, { count, isError }]) => ({
      label: name,
      count,
      isError,
    }),
  );

  return [...genericChips, ...namedChips];
}

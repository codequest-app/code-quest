import type { MessageNode } from './message-tree';

/** Assistant message types that get timeline dots */
const TIMELINE_TYPES = new Set(['text', 'thinking', 'tool_use', 'streamlined_text']);

type RenderGroup =
  | { kind: 'timeline'; nodes: MessageNode[]; prevRole: string | null }
  | { kind: 'single'; node: MessageNode; prevRole: string | null };

/** Group consecutive assistant nodes for timeline rendering. */
export function groupForTimeline(
  nodes: MessageNode[],
  firstPrevRole: string | null,
): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let assistantGroup: MessageNode[] = [];
  let groupPrevRole: string | null = firstPrevRole;

  const flushGroup = (nextPrevRole: string | null) => {
    if (assistantGroup.length > 0) {
      groups.push({ kind: 'timeline', nodes: assistantGroup, prevRole: groupPrevRole });
    }
    assistantGroup = [];
    groupPrevRole = nextPrevRole;
  };

  let prevRole = firstPrevRole;
  for (const node of nodes) {
    const isAssistantTimeline =
      node.message.role === 'assistant' && TIMELINE_TYPES.has(node.message.type);
    if (isAssistantTimeline) {
      if (assistantGroup.length === 0) groupPrevRole = prevRole;
      assistantGroup.push(node);
    } else {
      flushGroup(prevRole);
      groups.push({ kind: 'single', node, prevRole });
    }
    prevRole = node.message.role;
  }
  flushGroup(prevRole);

  return groups;
}

import type { Message } from '@/types/ui';

export interface MessageNode {
  message: Message;
  children: MessageNode[];
}

export function buildMessageTree(messages: Message[]): MessageNode[] {
  const roots: MessageNode[] = [];
  const toolUseNodes = new Map<string, MessageNode>();

  for (const message of messages) {
    const node: MessageNode = { message, children: [] };

    if (message.type === 'tool_use') {
      toolUseNodes.set(message.meta.toolId, node);
    }

    if (mergeToolResult(message, toolUseNodes)) continue;
    if (nestChild(node, toolUseNodes)) continue;

    roots.push(node);
  }

  return roots;
}

/** Merge tool_result content into the matching tool_use node's meta.result */
function mergeToolResult(message: Message, toolUseNodes: Map<string, MessageNode>): boolean {
  if (message.type !== 'tool_result') return false;
  const parent = toolUseNodes.get(message.meta.toolId);
  if (!parent) return false;
  parent.message = {
    ...parent.message,
    meta: {
      ...parent.message.meta,
      result: { content: message.content, is_error: message.meta.is_error },
    },
  } as Message;
  return true;
}

/** Nest a message under its parent tool_use as a child (subagent) */
function nestChild(node: MessageNode, toolUseNodes: Map<string, MessageNode>): boolean {
  if (!node.message.parentToolUseId) return false;
  const parent = toolUseNodes.get(node.message.parentToolUseId);
  if (!parent) return false;
  parent.children.push(node);
  return true;
}

const TIMELINE_TYPES = new Set(['text', 'thinking', 'tool_use', 'streamlined_text']);

export type RenderGroup =
  | { kind: 'timeline'; nodes: MessageNode[]; prevRole: string | null }
  | { kind: 'single'; node: MessageNode; prevRole: string | null };

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

export function filterTree(
  nodes: MessageNode[],
  predicate: (message: Message) => boolean,
): MessageNode[] {
  const result: MessageNode[] = [];
  for (const node of nodes) {
    if (!predicate(node.message)) continue;
    if (node.children.length === 0) {
      result.push(node);
      continue;
    }
    const filteredChildren = filterTree(node.children, predicate);
    result.push(
      filteredChildren === node.children ? node : { ...node, children: filteredChildren },
    );
  }
  const allKept = result.length === nodes.length && result.every((n, i) => n === nodes[i]);
  return allKept ? nodes : result;
}

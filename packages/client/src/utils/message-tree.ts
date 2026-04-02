import type { Message } from '../types/ui';

export interface MessageNode {
  message: Message;
  children: MessageNode[];
}

export function buildMessageTree(messages: Message[]): MessageNode[] {
  const roots: MessageNode[] = [];
  const toolUseNodes = new Map<string, MessageNode>();

  for (const message of messages) {
    const node: MessageNode = { message, children: [] };

    // 1. Register tool_use nodes for later lookup
    if (message.type === 'tool_use' && message.meta?.toolId) {
      toolUseNodes.set(String(message.meta.toolId), node);
    }

    // 2. Merge tool_result into its parent tool_use (not a separate node)
    if (mergeToolResult(message, toolUseNodes)) continue;

    // 3. Nest subagent children under their parent tool_use
    if (nestChild(node, toolUseNodes)) continue;

    roots.push(node);
  }

  return roots;
}

/** Merge tool_result content into the matching tool_use node's meta.result */
function mergeToolResult(message: Message, toolUseNodes: Map<string, MessageNode>): boolean {
  if (message.type !== 'tool_result' || !message.meta?.toolId) return false;
  const parent = toolUseNodes.get(String(message.meta.toolId));
  if (!parent) return false;
  parent.message = {
    ...parent.message,
    meta: {
      ...parent.message.meta,
      result: { content: message.content, is_error: message.meta?.is_error },
    },
  };
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

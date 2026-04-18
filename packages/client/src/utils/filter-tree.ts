import type { Message } from '../types/ui';
import type { MessageNode } from './message-tree';

/**
 * Recursively filter a tree of MessageNodes. A node is dropped entirely
 * (along with its subtree) when `predicate(node.message)` is false;
 * otherwise the node is kept and its children are filtered with the
 * same predicate. Returns the same-reference node when nothing changed,
 * so React's reconciler can skip unchanged subtrees.
 */
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
  // Preserve identity when nothing was filtered.
  const allKept = result.length === nodes.length && result.every((n, i) => n === nodes[i]);
  return allKept ? nodes : result;
}

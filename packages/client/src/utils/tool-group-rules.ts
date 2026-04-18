import type { MessageNode } from './message-tree';

export type TimelineRun =
  | { kind: 'grouped'; nodes: MessageNode[] }
  | { kind: 'solo'; node: MessageNode };

/**
 * Collapse any run of consecutive `tool_use` nodes (>= 2) into a grouped
 * "Explored N" block; everything else (text, thinking, single tool) emits
 * solo. We intentionally group regardless of read/write semantics — unlike
 * the extension — because cc-office workflows tend to produce long runs
 * of mixed reads and writes (e.g. opsx apply) and collapsing only
 * read-only ones still leaves a wall of Bash/Write blocks.
 */
export function splitTimelineRuns(nodes: MessageNode[]): TimelineRun[] {
  const runs: TimelineRun[] = [];
  let pending: MessageNode[] = [];

  const flush = () => {
    if (pending.length === 0) return;
    if (pending.length >= 2) {
      runs.push({ kind: 'grouped', nodes: pending });
    } else {
      for (const n of pending) runs.push({ kind: 'solo', node: n });
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

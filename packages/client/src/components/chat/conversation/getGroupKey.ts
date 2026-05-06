import type { RenderGroup } from '@/utils/message-tree';

export function getGroupKey(group: RenderGroup, index: number): string {
  if (group.kind === 'timeline') {
    return group.nodes[0]?.message.id ?? `timeline-${index}`;
  }
  return group.node.message.id;
}

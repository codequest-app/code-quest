import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import { filterTree } from '../filter-tree';
import type { MessageNode } from '../message-tree';

function node(id: string, type: Message['type'], children: MessageNode[] = []): MessageNode {
  // Minimal Message shape — `filterTree` only inspects `type`; `meta` variants
  // per type are irrelevant to this util's logic.
  const message = { id, role: 'assistant', type, content: id, timestamp: 0 } as Message;
  return { message, children };
}

describe('filterTree', () => {
  it('empty input → empty output', () => {
    expect(filterTree([], () => true)).toEqual([]);
  });

  it('keeps visible roots, drops hidden', () => {
    const a = node('a', 'text');
    const b = node('b', 'tool_use');
    const c = node('c', 'text');
    const result = filterTree([a, b, c], (m) => m.type !== 'tool_use');
    expect(result.map((n) => n.message.id)).toEqual(['a', 'c']);
  });

  it('filters nested children recursively', () => {
    const child1 = node('c1', 'tool_use');
    const child2 = node('c2', 'text');
    const parent = node('p', 'tool_use', [child1, child2]);
    const result = filterTree([parent], (m) => m.type !== 'tool_use');
    // parent is tool_use → whole subtree dropped
    expect(result).toEqual([]);
  });

  it('keeps parent but strips hidden children', () => {
    const child1 = node('c1', 'tool_use');
    const child2 = node('c2', 'text');
    const parent = node('p', 'text', [child1, child2]);
    const result = filterTree([parent], (m) => m.type !== 'tool_use');
    expect(result).toHaveLength(1);
    expect(result[0].message.id).toBe('p');
    expect(result[0].children.map((n) => n.message.id)).toEqual(['c2']);
  });

  it('preserves node identity when nothing changes', () => {
    const a = node('a', 'text');
    const result = filterTree([a], () => true);
    expect(result[0]).toBe(a);
  });

  it('drops deeply nested hidden subtree while keeping sibling branches', () => {
    const grand = node('g', 'tool_use');
    const mid = node('m', 'text', [grand]);
    const sibling = node('s', 'text');
    const root = node('r', 'text', [mid, sibling]);
    const result = filterTree([root], (m) => m.type !== 'tool_use');
    expect(result[0].children.map((n) => n.message.id)).toEqual(['m', 's']);
    expect(result[0].children[0].children).toEqual([]);
  });
});

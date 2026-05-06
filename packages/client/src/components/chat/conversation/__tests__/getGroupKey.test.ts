/* biome-ignore-all lint/suspicious/noExplicitAny: test stubs */
import { describe, expect, it } from 'vitest';
import type { RenderGroup } from '@/utils/message-tree';
import { getGroupKey } from '../getGroupKey.ts';

const node = (id: string) => ({ message: { id } }) as any;

describe('getGroupKey', () => {
  it('single group returns message id', () => {
    const group: RenderGroup = { kind: 'single', node: node('msg-1'), prevRole: null };
    expect(getGroupKey(group, 0)).toBe('msg-1');
  });

  it('timeline group with one node returns first node id', () => {
    const group: RenderGroup = { kind: 'timeline', nodes: [node('user-1')], prevRole: null };
    expect(getGroupKey(group, 0)).toBe('user-1');
  });

  it('timeline group key is stable when second node is added', () => {
    const before: RenderGroup = { kind: 'timeline', nodes: [node('user-1')], prevRole: null };
    const after: RenderGroup = {
      kind: 'timeline',
      nodes: [node('user-1'), node('asst-1')],
      prevRole: null,
    };
    expect(getGroupKey(before, 0)).toBe(getGroupKey(after, 0));
  });

  it('timeline group key is stable when third node is added', () => {
    const two: RenderGroup = {
      kind: 'timeline',
      nodes: [node('user-1'), node('asst-1')],
      prevRole: null,
    };
    const three: RenderGroup = {
      kind: 'timeline',
      nodes: [node('user-1'), node('asst-1'), node('tool-1')],
      prevRole: null,
    };
    expect(getGroupKey(two, 0)).toBe(getGroupKey(three, 0));
  });

  it('fallback to stable string when timeline has no nodes', () => {
    const group: RenderGroup = { kind: 'timeline', nodes: [], prevRole: null };
    expect(getGroupKey(group, 5)).toBe('timeline-5');
  });
});

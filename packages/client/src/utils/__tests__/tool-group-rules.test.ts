import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import type { MessageNode } from '../message-tree';
import { buildGroupChips, splitTimelineRuns } from '../tool-group-rules';

function toolNode(
  name: string,
  id = `t-${name}`,
  opts?: { isError?: boolean; input?: Record<string, unknown> },
): MessageNode {
  const message = {
    id,
    role: 'assistant',
    type: 'tool_use',
    content: name,
    meta: {
      toolId: id,
      input: opts?.input ?? {},
      result: opts?.isError ? { is_error: true } : undefined,
    },
    timestamp: 0,
  } as Message;
  return { message, children: [] };
}

function thinkingNode(id = 't-think'): MessageNode {
  return {
    message: { id, role: 'assistant', type: 'thinking', content: '', timestamp: 0 } as Message,
    children: [],
  };
}

function textNode(id = 't-text'): MessageNode {
  return {
    message: { id, role: 'assistant', type: 'text', content: 'hi', timestamp: 0 } as Message,
    children: [],
  };
}

describe('splitTimelineRuns', () => {
  it('empty input → empty output', () => {
    expect(splitTimelineRuns([])).toEqual([]);
  });

  it('single tool → solo (shown directly, not collapsed)', () => {
    const node = toolNode('Read');
    expect(splitTimelineRuns([node])).toEqual([{ kind: 'solo', node }]);
  });

  it('two consecutive tools → single group', () => {
    const nodes = [toolNode('Bash', '1'), toolNode('Write', '2')];
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'grouped', nodes }]);
  });

  it('five consecutive Bash → single group', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => toolNode('Bash', `b${i}`));
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'grouped', nodes }]);
  });

  it('mixed Bash/Write/Read all in a row → single group', () => {
    const nodes = [toolNode('Bash', '1'), toolNode('Write', '2'), toolNode('Read', '3')];
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'grouped', nodes }]);
  });

  it('thinking between tools → single before becomes solo, thinking is solo, pair after is grouped', () => {
    const b1 = toolNode('Bash', 'b1');
    const think = thinkingNode();
    const b2 = toolNode('Bash', 'b2');
    const b3 = toolNode('Bash', 'b3');
    expect(splitTimelineRuns([b1, think, b2, b3])).toEqual([
      { kind: 'solo', node: b1 },
      { kind: 'solo', node: think },
      { kind: 'grouped', nodes: [b2, b3] },
    ]);
  });

  it('text between tools → single before becomes solo, text is solo, pair after is grouped', () => {
    const b1 = toolNode('Bash', 'b1');
    const t = textNode();
    const b2 = toolNode('Bash', 'b2');
    const b3 = toolNode('Bash', 'b3');
    expect(splitTimelineRuns([b1, t, b2, b3])).toEqual([
      { kind: 'solo', node: b1 },
      { kind: 'solo', node: t },
      { kind: 'grouped', nodes: [b2, b3] },
    ]);
  });

  it('thinking is always solo', () => {
    const think = thinkingNode();
    expect(splitTimelineRuns([think])).toEqual([{ kind: 'solo', node: think }]);
  });
});

describe('buildGroupChips', () => {
  it('generic tools aggregated by name with count', () => {
    const nodes = [toolNode('Read', 'r1'), toolNode('Read', 'r2'), toolNode('Bash', 'b1')];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 2, isError: false },
      { label: 'Bash', count: 1, isError: false },
    ]);
  });

  it('Skill tool shows skill name with leading slash', () => {
    const nodes = [toolNode('Skill', 's1', { input: { skill: 'zod-validation' } })];
    expect(buildGroupChips(nodes)).toEqual([{ label: '/zod-validation', isError: false }]);
  });

  it('Skill with namespaced skill shows short name', () => {
    const nodes = [toolNode('Skill', 's1', { input: { skill: 'superpowers:brainstorming' } })];
    expect(buildGroupChips(nodes)).toEqual([{ label: '/brainstorming', isError: false }]);
  });

  it('Task tool shows description from input', () => {
    const nodes = [toolNode('Task', 't1', { input: { description: 'Analyze protocol.md' } })];
    expect(buildGroupChips(nodes)).toEqual([{ label: 'Analyze protocol.md', isError: false }]);
  });

  it('Task tool falls back to "Agent" when no description', () => {
    expect(buildGroupChips([toolNode('Task', 't1')])).toEqual([{ label: 'Agent', isError: false }]);
  });

  it('error tool marks chip as error', () => {
    const nodes = [toolNode('Bash', 'b1', { isError: true })];
    expect(buildGroupChips(nodes)).toEqual([{ label: 'Bash', count: 1, isError: true }]);
  });

  it('partial error: only erroring tool type is marked', () => {
    const nodes = [toolNode('Read', 'r1'), toolNode('Bash', 'b1', { isError: true })];
    const chips = buildGroupChips(nodes);
    expect(chips.find((c) => c.label === 'Read')?.isError).toBe(false);
    expect(chips.find((c) => c.label === 'Bash')?.isError).toBe(true);
  });

  it('mixed: generic + Skill + Task', () => {
    const nodes = [
      toolNode('Read', 'r1'),
      toolNode('Skill', 's1', { input: { skill: 'zod-validation' } }),
      toolNode('Task', 't1', { input: { description: 'Run analysis' } }),
    ];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 1, isError: false },
      { label: '/zod-validation', isError: false },
      { label: 'Run analysis', isError: false },
    ]);
  });
});

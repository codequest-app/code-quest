import { describe, expect, it } from 'vitest';
import type { MessageNode } from '../message-tree';
import { splitTimelineRuns } from '../tool-group-rules';

function toolNode(name: string, id = `t-${name}`): MessageNode {
  return {
    message: {
      id,
      role: 'assistant',
      type: 'tool_use',
      content: name,
      timestamp: 0,
      meta: { toolId: id, input: {} },
    } as never,
    children: [],
  };
}

function textNode(content = 'hello', id = 't-text'): MessageNode {
  return {
    message: { id, role: 'assistant', type: 'text', content, timestamp: 0 } as never,
    children: [],
  };
}

describe('splitTimelineRuns', () => {
  it('empty input → empty output', () => {
    expect(splitTimelineRuns([])).toEqual([]);
  });

  it('single tool → solo (no group for 1)', () => {
    const nodes = [toolNode('Read')];
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'solo', node: nodes[0] }]);
  });

  it('two consecutive tool_use of any kind → grouped', () => {
    const nodes = [toolNode('Bash', '1'), toolNode('Write', '2')];
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'grouped', nodes }]);
  });

  it('five consecutive Bash → grouped as one', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => toolNode('Bash', `b${i}`));
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'grouped', nodes }]);
  });

  it('mixed Bash/Write/Read all in a row → single grouped run', () => {
    const nodes = [
      toolNode('Bash', '1'),
      toolNode('Write', '2'),
      toolNode('Read', '3'),
      toolNode('Edit', '4'),
    ];
    expect(splitTimelineRuns(nodes)).toEqual([{ kind: 'grouped', nodes }]);
  });

  it('assistant text between tools splits into separate runs', () => {
    const b1 = toolNode('Bash', 'b1');
    const t = textNode('hi', 't');
    const b2 = toolNode('Bash', 'b2');
    const b3 = toolNode('Bash', 'b3');
    expect(splitTimelineRuns([b1, t, b2, b3])).toEqual([
      { kind: 'solo', node: b1 },
      { kind: 'solo', node: t },
      { kind: 'grouped', nodes: [b2, b3] },
    ]);
  });

  it('thinking also splits a group', () => {
    const b1 = toolNode('Bash', 'b1');
    const think: ReturnType<typeof textNode> = {
      message: { id: 'k', role: 'assistant', type: 'thinking', content: '', timestamp: 0 } as never,
      children: [],
    };
    const b2 = toolNode('Bash', 'b2');
    const b3 = toolNode('Bash', 'b3');
    expect(splitTimelineRuns([b1, think, b2, b3])).toEqual([
      { kind: 'solo', node: b1 },
      { kind: 'solo', node: think },
      { kind: 'grouped', nodes: [b2, b3] },
    ]);
  });
});

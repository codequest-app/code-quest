import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import {
  buildGroupChips,
  getToolHeaderInfo,
  isMcpTool,
  parseMcpToolName,
  splitTimelineRuns,
} from '@/utils/tool-utils';
import type { MessageNode } from '../message-tree.ts';

describe('tool-registry', () => {
  describe('getToolHeaderInfo', () => {
    it('Bash: name=Bash, detail=description', () => {
      expect(getToolHeaderInfo('Bash', { command: 'ls', description: 'List files' })).toEqual({
        name: 'Bash',
        detail: 'List files',
      });
    });

    it('Bash without description: no detail', () => {
      expect(getToolHeaderInfo('Bash', { command: 'ls' })).toEqual({ name: 'Bash' });
    });

    it('Read: name=Read, detail=basename, range from offset+limit', () => {
      expect(
        getToolHeaderInfo('Read', { file_path: '/src/index.ts', offset: 9, limit: 10 }),
      ).toEqual({ name: 'Read', detail: 'index.ts', range: '(lines 10-19)' });
    });

    it('Read: offset only', () => {
      expect(getToolHeaderInfo('Read', { file_path: '/src/app.ts', offset: 5 })).toEqual({
        name: 'Read',
        detail: 'app.ts',
        range: '(from line 6)',
      });
    });

    it('Read: no offset/limit → no range', () => {
      expect(getToolHeaderInfo('Read', { file_path: '/src/app.ts' })).toEqual({
        name: 'Read',
        detail: 'app.ts',
      });
    });

    it('Write: name + basename', () => {
      expect(getToolHeaderInfo('Write', { file_path: '/tmp/out.txt' })).toEqual({
        name: 'Write',
        detail: 'out.txt',
      });
    });

    it('Edit: name + basename', () => {
      expect(getToolHeaderInfo('Edit', { file_path: '/src/lib.ts' })).toEqual({
        name: 'Edit',
        detail: 'lib.ts',
      });
    });

    it('WebSearch: name + query', () => {
      expect(getToolHeaderInfo('WebSearch', { query: 'react hooks' })).toEqual({
        name: 'WebSearch',
        detail: 'react hooks',
      });
    });

    it('Agent: name + description', () => {
      expect(getToolHeaderInfo('Agent', { description: 'Run tests' })).toEqual({
        name: 'Agent',
        detail: 'Run tests',
      });
    });

    it('Task maps to Agent', () => {
      expect(getToolHeaderInfo('Task', { prompt: 'Deploy' })).toEqual({
        name: 'Agent',
        detail: 'Deploy',
      });
    });

    it('MCP tool: server::tool + detail', () => {
      expect(getToolHeaderInfo('mcp__github__create_issue', { query: 'bug' })).toEqual({
        name: 'github::create_issue',
        detail: 'bug',
      });
    });

    it('unknown: just name', () => {
      expect(getToolHeaderInfo('CustomTool', {})).toEqual({ name: 'CustomTool' });
    });
  });

  describe('isMcpTool', () => {
    it('detects mcp__ prefix', () => expect(isMcpTool('mcp__github__issues')).toBe(true));
    it('rejects non-mcp tools', () => expect(isMcpTool('Bash')).toBe(false));
  });

  describe('parseMcpToolName', () => {
    it('splits server and tool', () => {
      expect(parseMcpToolName('mcp__github__create_issue')).toEqual({
        server: 'github',
        tool: 'create_issue',
      });
    });
  });
});

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

  it('insertion order preserved: generic before named before generic', () => {
    const nodes = [
      toolNode('Read', 'r1'),
      toolNode('Skill', 's1', { input: { skill: 'zod-validation' } }),
      toolNode('Bash', 'b1'),
    ];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 1, isError: false },
      { label: '/zod-validation', isError: false },
      { label: 'Bash', count: 1, isError: false },
    ]);
  });

  it('same generic tool aggregated in-place, preserving first occurrence position', () => {
    const nodes = [toolNode('Read', 'r1'), toolNode('Bash', 'b1'), toolNode('Read', 'r2')];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 2, isError: false },
      { label: 'Bash', count: 1, isError: false },
    ]);
  });
});

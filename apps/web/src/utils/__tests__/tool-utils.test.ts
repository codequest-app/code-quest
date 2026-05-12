import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import {
  buildGroupChips,
  getToolHeaderInfo,
  isMcpTool,
  parseMcpToolName,
  splitTimelineRuns,
} from '@/utils/tool-utils';

describe('tool-registry', () => {
  describe('getToolHeaderInfo', () => {
    it('Bash: name=Bash, detail=description', () => {
      expect(getToolHeaderInfo('Bash', { command: 'ls', description: 'List files' })).toEqual({
        name: 'Bash',
        detail: 'List files',
      });
    });

    it('Bash without description: uses command summary as detail', () => {
      expect(getToolHeaderInfo('Bash', { command: 'ls' })).toEqual({ name: 'Bash', detail: 'ls' });
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

function toolMsg(
  name: string,
  id = `t-${name}`,
  opts?: { isError?: boolean; input?: Record<string, unknown> },
): Message {
  return {
    id,
    role: 'assistant',
    type: 'tool_use',
    content: name,
    toolId: id,
    input: opts?.input ?? {},
    result: opts?.isError ? { is_error: true } : undefined,
    timestamp: 0,
  } as Message;
}

function thinkingMsg(id = 't-think'): Message {
  return { id, role: 'assistant', type: 'thinking', content: '', timestamp: 0 } as Message;
}

function textMsg(id = 't-text'): Message {
  return { id, role: 'assistant', type: 'text', content: 'hi', timestamp: 0 } as Message;
}

describe('splitTimelineRuns', () => {
  it('empty input → empty output', () => {
    expect(splitTimelineRuns([])).toEqual([]);
  });

  it('single tool → solo (shown directly, not collapsed)', () => {
    const m = toolMsg('Read');
    expect(splitTimelineRuns([m])).toEqual([{ kind: 'solo', message: m }]);
  });

  it('two consecutive tools → single group', () => {
    const msgs = [toolMsg('Bash', '1'), toolMsg('Write', '2')];
    expect(splitTimelineRuns(msgs)).toEqual([{ kind: 'grouped', messages: msgs }]);
  });

  it('five consecutive Bash → single group', () => {
    const msgs = Array.from({ length: 5 }, (_, i) => toolMsg('Bash', `b${i}`));
    expect(splitTimelineRuns(msgs)).toEqual([{ kind: 'grouped', messages: msgs }]);
  });

  it('mixed Bash/Write/Read all in a row → single group', () => {
    const msgs = [toolMsg('Bash', '1'), toolMsg('Write', '2'), toolMsg('Read', '3')];
    expect(splitTimelineRuns(msgs)).toEqual([{ kind: 'grouped', messages: msgs }]);
  });

  it('thinking between tools → single before becomes solo, thinking is solo, pair after is grouped', () => {
    const b1 = toolMsg('Bash', 'b1');
    const think = thinkingMsg();
    const b2 = toolMsg('Bash', 'b2');
    const b3 = toolMsg('Bash', 'b3');
    expect(splitTimelineRuns([b1, think, b2, b3])).toEqual([
      { kind: 'solo', message: b1 },
      { kind: 'solo', message: think },
      { kind: 'grouped', messages: [b2, b3] },
    ]);
  });

  it('text between tools → single before becomes solo, text is solo, pair after is grouped', () => {
    const b1 = toolMsg('Bash', 'b1');
    const t = textMsg();
    const b2 = toolMsg('Bash', 'b2');
    const b3 = toolMsg('Bash', 'b3');
    expect(splitTimelineRuns([b1, t, b2, b3])).toEqual([
      { kind: 'solo', message: b1 },
      { kind: 'solo', message: t },
      { kind: 'grouped', messages: [b2, b3] },
    ]);
  });

  it('thinking is always solo', () => {
    const think = thinkingMsg();
    expect(splitTimelineRuns([think])).toEqual([{ kind: 'solo', message: think }]);
  });
});

describe('buildGroupChips', () => {
  it('generic tools aggregated by name with count', () => {
    const nodes = [toolMsg('Read', 'r1'), toolMsg('Read', 'r2'), toolMsg('Bash', 'b1')];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 2, isError: false },
      { label: 'Bash', count: 1, isError: false },
    ]);
  });

  it('Skill tool shows skill name with leading slash', () => {
    const nodes = [toolMsg('Skill', 's1', { input: { skill: 'zod-validation' } })];
    expect(buildGroupChips(nodes)).toEqual([{ label: '/zod-validation', isError: false }]);
  });

  it('Skill with namespaced skill shows short name', () => {
    const nodes = [toolMsg('Skill', 's1', { input: { skill: 'superpowers:brainstorming' } })];
    expect(buildGroupChips(nodes)).toEqual([{ label: '/brainstorming', isError: false }]);
  });

  it('Task tool shows description from input', () => {
    const nodes = [toolMsg('Task', 't1', { input: { description: 'Analyze protocol.md' } })];
    expect(buildGroupChips(nodes)).toEqual([{ label: 'Analyze protocol.md', isError: false }]);
  });

  it('Task tool falls back to "Agent" when no description', () => {
    expect(buildGroupChips([toolMsg('Task', 't1')])).toEqual([{ label: 'Agent', isError: false }]);
  });

  it('error tool marks chip as error', () => {
    const nodes = [toolMsg('Bash', 'b1', { isError: true })];
    expect(buildGroupChips(nodes)).toEqual([{ label: 'Bash', count: 1, isError: true }]);
  });

  it('partial error: only erroring tool type is marked', () => {
    const nodes = [toolMsg('Read', 'r1'), toolMsg('Bash', 'b1', { isError: true })];
    const chips = buildGroupChips(nodes);
    expect(chips.find((c) => c.label === 'Read')?.isError).toBe(false);
    expect(chips.find((c) => c.label === 'Bash')?.isError).toBe(true);
  });

  it('mixed: generic + Skill + Task', () => {
    const nodes = [
      toolMsg('Read', 'r1'),
      toolMsg('Skill', 's1', { input: { skill: 'zod-validation' } }),
      toolMsg('Task', 't1', { input: { description: 'Run analysis' } }),
    ];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 1, isError: false },
      { label: '/zod-validation', isError: false },
      { label: 'Run analysis', isError: false },
    ]);
  });

  it('insertion order preserved: generic before named before generic', () => {
    const nodes = [
      toolMsg('Read', 'r1'),
      toolMsg('Skill', 's1', { input: { skill: 'zod-validation' } }),
      toolMsg('Bash', 'b1'),
    ];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 1, isError: false },
      { label: '/zod-validation', isError: false },
      { label: 'Bash', count: 1, isError: false },
    ]);
  });

  it('same generic tool aggregated in-place, preserving first occurrence position', () => {
    const nodes = [toolMsg('Read', 'r1'), toolMsg('Bash', 'b1'), toolMsg('Read', 'r2')];
    expect(buildGroupChips(nodes)).toEqual([
      { label: 'Read', count: 2, isError: false },
      { label: 'Bash', count: 1, isError: false },
    ]);
  });
});

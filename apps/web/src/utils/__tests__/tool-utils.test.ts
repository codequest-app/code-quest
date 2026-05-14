import { describe, expect, it } from 'vitest';
import type { Message } from '@/types/ui';
import { buildGroupChips, splitTimelineRuns } from '@/utils/timeline-utils';
import { getToolHeaderInfo, isMcpTool, parseMcpToolName } from '@/utils/tool-utils';

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

function assistantTurnMsg(
  toolName: string,
  id = `at-${toolName}`,
  opts: { withThinking?: boolean } = {},
): Message {
  const blocks = [
    ...(opts.withThinking ? [{ id: `${id}-think`, type: 'thinking' as const, content: '' }] : []),
    { id: `${id}-tool`, type: 'tool_use' as const, content: toolName, toolId: `${id}-tool` },
  ];
  return {
    id,
    role: 'assistant',
    type: 'assistant_turn',
    content: toolName,
    blocks,
    timestamp: 0,
  } as Message;
}

function textMsg(id = 't-text'): Message {
  return { id, role: 'assistant', type: 'text', content: 'hi', timestamp: 0 } as Message;
}

function actionResultMsg(id = 'ar-1', content = 'Approved: Bash'): Message {
  return { id, role: 'user', type: 'action_result', content, timestamp: 0 } as Message;
}

function pendingActionMsg(id = 'pa-1'): Message {
  return { id, role: 'user', type: 'pending_action', content: '', timestamp: 0 } as Message;
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

  it('assistant_turn with thinking+tool_use is treated as tool message → groups with adjacent tools', () => {
    const m1 = assistantTurnMsg('Bash', 'at1', { withThinking: true });
    const m2 = assistantTurnMsg('Read', 'at2', { withThinking: true });
    expect(splitTimelineRuns([m1, m2])).toEqual([{ kind: 'grouped', messages: [m1, m2] }]);
  });

  it('assistant_turn with thinking+tool_use groups with plain tool_use messages', () => {
    const m1 = toolMsg('Bash', 'b1');
    const m2 = assistantTurnMsg('Read', 'at2', { withThinking: true });
    const m3 = toolMsg('Write', 'w1');
    expect(splitTimelineRuns([m1, m2, m3])).toEqual([{ kind: 'grouped', messages: [m1, m2, m3] }]);
  });

  // Real-world pattern from DB session 513938c2:
  // Each assistant message has SAME message.id for text + tool_use blocks,
  // so they merge into one assistant_turn with [text, tool_use].
  // These must stay SOLO — the text is the assistant's visible response.
  it('assistant_turn with text+tool_use stays solo (text block means it is a response, not just a tool call)', () => {
    const m = {
      id: 'at-1',
      role: 'assistant',
      type: 'assistant_turn',
      content: 'Let me read the file',
      blocks: [
        { id: 'b1', type: 'text', content: 'Let me read the file' },
        { id: 'b2', type: 'tool_use', content: 'Read', toolId: 'tu-1' },
      ],
      timestamp: 0,
    } as Message;
    expect(splitTimelineRuns([m])).toEqual([{ kind: 'solo', message: m }]);
  });

  it('multiple consecutive assistant_turn [text+tool_use] stay solo, not grouped', () => {
    const m1 = {
      id: 'at-1',
      role: 'assistant',
      type: 'assistant_turn',
      content: 'Let me read...',
      blocks: [
        { id: 'b1', type: 'text', content: 'Let me read...' },
        { id: 'b2', type: 'tool_use', content: 'Read', toolId: 'tu-1' },
      ],
      timestamp: 0,
    } as Message;
    const m2 = {
      id: 'at-2',
      role: 'assistant',
      type: 'assistant_turn',
      content: 'Now edit...',
      blocks: [
        { id: 'b3', type: 'text', content: 'Now edit...' },
        { id: 'b4', type: 'tool_use', content: 'Edit', toolId: 'tu-2' },
      ],
      timestamp: 0,
    } as Message;
    expect(splitTimelineRuns([m1, m2])).toEqual([
      { kind: 'solo', message: m1 },
      { kind: 'solo', message: m2 },
    ]);
  });

  it('assistant_turn with only thinking blocks (no tool_use) stays solo', () => {
    const thinkOnly = {
      id: 'at-think',
      role: 'assistant',
      type: 'assistant_turn',
      content: '',
      blocks: [{ id: 'b1', type: 'thinking', content: '' }],
      timestamp: 0,
    } as Message;
    const tool = toolMsg('Bash', 'b1');
    expect(splitTimelineRuns([thinkOnly, tool])).toEqual([
      { kind: 'solo', message: thinkOnly },
      { kind: 'solo', message: tool },
    ]);
  });

  it('[tool, action_result, tool] → single grouped run (action_result does not break group)', () => {
    const b1 = toolMsg('Bash', 'b1');
    const ar = actionResultMsg();
    const r1 = toolMsg('Read', 'r1');
    expect(splitTimelineRuns([b1, ar, r1])).toEqual([{ kind: 'grouped', messages: [b1, ar, r1] }]);
  });

  it('[tool, pending_action, tool] → single grouped run', () => {
    const b1 = toolMsg('Bash', 'b1');
    const pa = pendingActionMsg();
    const r1 = toolMsg('Read', 'r1');
    expect(splitTimelineRuns([b1, pa, r1])).toEqual([{ kind: 'grouped', messages: [b1, pa, r1] }]);
  });

  it('[tool, action_result, tool, action_result, tool] → single grouped run', () => {
    const b1 = toolMsg('Bash', 'b1');
    const ar1 = actionResultMsg('ar-1');
    const r1 = toolMsg('Read', 'r1');
    const ar2 = actionResultMsg('ar-2');
    const w1 = toolMsg('Write', 'w1');
    expect(splitTimelineRuns([b1, ar1, r1, ar2, w1])).toEqual([
      { kind: 'grouped', messages: [b1, ar1, r1, ar2, w1] },
    ]);
  });

  it('[action_result] alone stays solo', () => {
    const ar = actionResultMsg();
    expect(splitTimelineRuns([ar])).toEqual([{ kind: 'solo', message: ar }]);
  });

  it('text breaks the group even with action_result inside', () => {
    const b1 = toolMsg('Bash', 'b1');
    const ar = actionResultMsg();
    const t = textMsg();
    const r1 = toolMsg('Read', 'r1');
    expect(splitTimelineRuns([b1, ar, t, r1])).toEqual([
      { kind: 'grouped', messages: [b1, ar] },
      { kind: 'solo', message: t },
      { kind: 'solo', message: r1 },
    ]);
  });

  it('buildGroupChips extracts tool name from assistant_turn with thinking+tool_use', () => {
    const m1 = assistantTurnMsg('Bash', 'at1', { withThinking: true });
    const m2 = assistantTurnMsg('Read', 'at2', { withThinking: true });
    expect(buildGroupChips([m1, m2])).toEqual([
      { label: 'Bash', count: 1, isError: false },
      { label: 'Read', count: 1, isError: false },
    ]);
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

  it('tool_use with empty content is skipped (no invisible-label chip)', () => {
    const nodes = [toolMsg('', 't1'), toolMsg('', 't2')];
    expect(buildGroupChips(nodes)).toEqual([]);
  });

  it('empty-content tool mixed with valid tool only shows the valid chip', () => {
    const nodes = [toolMsg('', 't1'), toolMsg('Bash', 'b1')];
    expect(buildGroupChips(nodes)).toEqual([{ label: 'Bash', count: 1, isError: false }]);
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

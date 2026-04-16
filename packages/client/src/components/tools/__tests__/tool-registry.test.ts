import { describe, expect, it } from 'vitest';
import { getToolHeaderInfo, isMcpTool, parseMcpToolName } from '../tool-registry';

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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpTool } from '../../stores/mcpStore';
import { useMcpStore } from '../../stores/mcpStore';
import { createMcpApi } from '../useMcpApi';

describe('createMcpApi', () => {
  beforeEach(() => {
    useMcpStore.setState({ tools: [], loading: false });
  });

  it('fetchTools emits mcp:list and updates store', async () => {
    const serverTools: McpTool[] = [
      { id: 'custom-1', name: 'Custom', description: 'A custom tool', installed: true },
    ];
    const emit = vi.fn((_event: string, callback: (tools: McpTool[]) => void) => {
      callback(serverTools);
    });
    const api = createMcpApi(emit);
    if (!api) throw new Error('expected api');
    await api.fetchTools();
    expect(emit).toHaveBeenCalledWith('mcp:list', expect.any(Function));
    expect(useMcpStore.getState().tools).toEqual(serverTools);
  });

  it('returns null when emit is null', () => {
    expect(createMcpApi(null)).toBeNull();
  });
});

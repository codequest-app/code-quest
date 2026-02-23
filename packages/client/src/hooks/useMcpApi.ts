import type { McpTool } from '../stores/mcpStore';
import { useMcpStore } from '../stores/mcpStore';

type EmitFn = (event: string, callback: (tools: McpTool[]) => void) => void;

interface McpApi {
  fetchTools: () => Promise<void>;
}

export function createMcpApi(emit: EmitFn | null): McpApi | null {
  if (!emit) return null;

  return {
    fetchTools: () =>
      new Promise<void>((resolve) => {
        useMcpStore.getState().setLoading(true);
        emit('mcp:list', (tools: McpTool[]) => {
          useMcpStore.getState().setTools(tools);
          useMcpStore.getState().setLoading(false);
          resolve();
        });
      }),
  };
}

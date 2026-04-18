import type { Feature } from '../../lib/feature';

export function createMcpStatusFeature({ onMcpStatus }: { onMcpStatus?: () => void }): Feature {
  return {
    id: 'mcp-status',
    label: 'MCP status',
    category: 'Customize',
    order: 0,
    ui: { closeSilent: true },
    execute() {
      onMcpStatus?.();
    },
  };
}

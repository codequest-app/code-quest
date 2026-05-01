import type { Feature } from '@/lib/feature';

export function createMcpServersFeature({ onToggleMcp }: { onToggleMcp?: () => void }): Feature {
  return {
    id: 'mcp-servers',
    label: 'Manage MCP servers',
    section: 'Customize',
    order: 1,
    ui: { closeSilent: true },
    execute() {
      onToggleMcp?.();
    },
  };
}

import type { MenuItemFeature } from '../../lib/feature';

export function createMcpStatusFeature({
  onMcpStatus,
}: {
  onMcpStatus?: () => void;
}): MenuItemFeature {
  return {
    id: 'mcp-status',
    menuItem: { label: 'MCP status', section: 'Customize', order: 0, closeSilent: true },
    execute() {
      onMcpStatus?.();
    },
  };
}

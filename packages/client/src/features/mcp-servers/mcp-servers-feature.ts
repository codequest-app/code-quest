import type { MenuItemFeature } from '../../lib/feature';

export function createMcpServersFeature({
  onToggleMcp,
}: {
  onToggleMcp?: () => void;
}): MenuItemFeature {
  return {
    id: 'mcp-servers',
    menuItem: { label: 'Manage MCP servers', section: 'Customize', order: 1, closeSilent: true },
    execute() {
      onToggleMcp?.();
    },
  };
}

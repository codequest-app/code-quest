import { describe, expect, it, vi } from 'vitest';
import { createMcpServersFeature } from '../mcp-servers-feature';

describe('createMcpServersFeature', () => {
  it('has id mcp-servers with label in Customize section', () => {
    const feature = createMcpServersFeature({ onToggleMcp: vi.fn() });
    expect(feature.id).toBe('mcp-servers');
    expect(feature.menuItem.label).toBe('Manage MCP servers');
    expect(feature.menuItem.section).toBe('Customize');
    expect(feature.menuItem.order).toBe(1);
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('execute calls onToggleMcp', () => {
    const onToggleMcp = vi.fn();
    createMcpServersFeature({ onToggleMcp }).execute();
    expect(onToggleMcp).toHaveBeenCalledOnce();
  });

  it('execute is a no-op when onToggleMcp is undefined', () => {
    expect(() => createMcpServersFeature({}).execute()).not.toThrow();
  });
});

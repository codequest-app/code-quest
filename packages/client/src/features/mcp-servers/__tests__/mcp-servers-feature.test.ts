import { describe, expect, it, vi } from 'vitest';
import { createMcpServersFeature } from '../mcp-servers-feature';

describe('createMcpServersFeature', () => {
  it('has id mcp-servers with label in Customize section', () => {
    const feature = createMcpServersFeature({ onToggleMcp: vi.fn() });
    expect(feature.id).toBe('mcp-servers');
    expect(feature.label).toBe('Manage MCP servers');
    expect(feature.section).toBe('Customize');
    expect(feature.order).toBe(1);
    expect(feature.ui?.closeSilent).toBe(true);
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

import { describe, expect, it, vi } from 'vitest';
import { createMcpStatusFeature } from '../mcp-status-feature';

describe('createMcpStatusFeature', () => {
  it('has id mcp-status', () => {
    expect(createMcpStatusFeature({}).id).toBe('mcp-status');
  });

  it('menuItem is in Customize section with label MCP status', () => {
    const { menuItem } = createMcpStatusFeature({});
    expect(menuItem.label).toBe('MCP status');
    expect(menuItem.section).toBe('Customize');
    expect(menuItem.closeSilent).toBe(true);
  });

  it('execute calls onMcpStatus', () => {
    const onMcpStatus = vi.fn();
    createMcpStatusFeature({ onMcpStatus }).execute();
    expect(onMcpStatus).toHaveBeenCalledOnce();
  });

  it('execute does nothing when onMcpStatus is not provided', () => {
    expect(() => createMcpStatusFeature({}).execute()).not.toThrow();
  });
});

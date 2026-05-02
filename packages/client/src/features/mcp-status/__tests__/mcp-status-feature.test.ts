import { describe, expect, it, vi } from 'vitest';
import { createMcpStatusFeature } from '../mcp-status-feature.ts';

describe('createMcpStatusFeature', () => {
  it('has id mcp-status', () => {
    expect(createMcpStatusFeature({}).id).toBe('mcp-status');
  });

  it('is in Customize section with label MCP status', () => {
    const feature = createMcpStatusFeature({});
    expect(feature.label).toBe('MCP status');
    expect(feature.section).toBe('Customize');
    expect(feature.ui?.closeSilent).toBe(true);
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

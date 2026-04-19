import { describe, expect, it, vi } from 'vitest';
import { createRawPanelFeature } from '../raw-panel-feature';

describe('createRawPanelFeature', () => {
  it('has id raw-panel in Panels section with label Raw Event Panel', () => {
    const feature = createRawPanelFeature({ active: false, onToggle: vi.fn() });
    expect(feature.id).toBe('raw-panel');
    expect(feature.section).toBe('Panels');
    expect(feature.label).toBe('Raw Event Panel');
  });

  it('state reflects active: false → active false', () => {
    const feature = createRawPanelFeature({ active: false, onToggle: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: false });
  });

  it('state reflects active: true → active true', () => {
    const feature = createRawPanelFeature({ active: true, onToggle: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: true });
  });

  it('execute calls onToggle', () => {
    const onToggle = vi.fn();
    createRawPanelFeature({ active: false, onToggle }).execute();
    expect(onToggle).toHaveBeenCalledOnce();
  });
});

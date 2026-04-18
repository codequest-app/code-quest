import { describe, expect, it, vi } from 'vitest';
import { createUsageFeature, usageOpenSignal } from '../usage-feature';

describe('createUsageFeature', () => {
  it('has id usage, /usage slash command, and Account menu item', () => {
    const feature = createUsageFeature({ emitRefreshUsage: vi.fn() });
    expect(feature.id).toBe('usage');
    expect(feature.command).toBe('/usage');
    expect(feature.menuItem.label).toBe('Account & usage…');
    expect(feature.menuItem.section).toBe('Model');
    expect(feature.menuItem.order).toBe(40);
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('execute emits refresh and opens dialog', () => {
    usageOpenSignal.setOpen(false);
    const emitRefreshUsage = vi.fn();
    createUsageFeature({ emitRefreshUsage }).execute();
    expect(emitRefreshUsage).toHaveBeenCalledOnce();
    expect(usageOpenSignal.isOpen).toBe(true);
    usageOpenSignal.setOpen(false);
  });

  it('invoke delegates to execute', () => {
    usageOpenSignal.setOpen(false);
    const emitRefreshUsage = vi.fn();
    const feature = createUsageFeature({ emitRefreshUsage });
    feature.invoke('/usage');
    expect(emitRefreshUsage).toHaveBeenCalledOnce();
    expect(usageOpenSignal.isOpen).toBe(true);
    usageOpenSignal.setOpen(false);
  });
});

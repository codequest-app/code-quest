import { describe, expect, it, vi } from 'vitest';
import { createUsageFeature, usageOpenSignal } from '../usage-feature';

describe('createUsageFeature', () => {
  it('has id usage, /usage slash binding, and Account menu fields', () => {
    const feature = createUsageFeature({ emitRefreshUsage: vi.fn() });
    expect(feature.id).toBe('usage');
    expect(feature.slash?.command).toBe('/usage');
    expect(feature.label).toBe('Account & usage…');
    expect(feature.category).toBe('Model');
    expect(feature.order).toBe(40);
    expect(feature.ui?.closeSilent).toBe(true);
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
    feature.slash?.invoke('/usage');
    expect(emitRefreshUsage).toHaveBeenCalledOnce();
    expect(usageOpenSignal.isOpen).toBe(true);
    usageOpenSignal.setOpen(false);
  });
});

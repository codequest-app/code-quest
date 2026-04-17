import { afterEach, describe, expect, it, vi } from 'vitest';
import { createResumeFeature, resumeOpenSignal } from '../resume-feature';

afterEach(() => {
  resumeOpenSignal.setOpen(false);
});

describe('createResumeFeature', () => {
  it('has id resume', () => {
    const feature = createResumeFeature();
    expect(feature.id).toBe('resume');
  });

  it('menuItem is in Context section with label Resume conversation…', () => {
    const feature = createResumeFeature();
    expect(feature.menuItem.label).toBe('Resume conversation…');
    expect(feature.menuItem.section).toBe('Context');
  });

  it('execute sets signal open to true', () => {
    const feature = createResumeFeature();
    expect(resumeOpenSignal.isOpen).toBe(false);
    feature.execute();
    expect(resumeOpenSignal.isOpen).toBe(true);
  });

  it('signal notifies subscriber on open', () => {
    const cb = vi.fn();
    const unsub = resumeOpenSignal.subscribe(cb);
    createResumeFeature().execute();
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('setOpen(false) closes signal', () => {
    resumeOpenSignal.setOpen(true);
    resumeOpenSignal.setOpen(false);
    expect(resumeOpenSignal.isOpen).toBe(false);
  });

  it('setOpen with same value does not notify', () => {
    const cb = vi.fn();
    const unsub = resumeOpenSignal.subscribe(cb);
    resumeOpenSignal.setOpen(false); // already false
    expect(cb).not.toHaveBeenCalled();
    unsub();
  });
});

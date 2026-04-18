import { afterEach, describe, expect, it, vi } from 'vitest';
import { btwSignal, createBtwFeature, createBtwLocalFeature } from '../btw-feature';

const CLOSED = { open: false, question: '', answer: null, loading: false, error: null };

afterEach(() => {
  btwSignal.setState(CLOSED);
});

describe('createBtwFeature', () => {
  it('returns a Feature with id btw, /btw slash binding, and Slash Commands category', () => {
    const feature = createBtwFeature({ askSideQuestion: vi.fn() });
    expect(feature.id).toBe('btw');
    expect(feature.label).toBe('/btw');
    expect(feature.category).toBe('Slash Commands');
    expect(feature.slash?.command).toBe('/btw');
    expect(feature.ui?.matchFirstToken).toBe(true);
  });

  describe('slash.match', () => {
    const feature = createBtwFeature({ askSideQuestion: vi.fn() });

    it('matches /btw alone', () => {
      expect(feature.slash?.match?.('/btw')).toBe(true);
    });

    it('matches /btw with question', () => {
      expect(feature.slash?.match?.('/btw what is 2+2?')).toBe(true);
    });

    it('does not match /btwx', () => {
      expect(feature.slash?.match?.('/btwx')).toBe(false);
    });

    it('does not match /compact', () => {
      expect(feature.slash?.match?.('/compact')).toBe(false);
    });
  });

  describe('slash.invoke', () => {
    it('does nothing when no question', () => {
      const askSideQuestion = vi.fn();
      const feature = createBtwFeature({ askSideQuestion });
      feature.slash?.invoke('/btw');
      expect(askSideQuestion).not.toHaveBeenCalled();
      expect(btwSignal.getState().open).toBe(false);
    });

    it('opens signal with loading state and calls RPC', () => {
      const askSideQuestion = vi.fn().mockResolvedValue({ ok: true, data: { answer: '4' } });
      const feature = createBtwFeature({ askSideQuestion });
      feature.slash?.invoke('/btw what is 2+2?');
      expect(btwSignal.getState()).toMatchObject({
        open: true,
        question: 'what is 2+2?',
        loading: true,
        answer: null,
        error: null,
      });
      expect(askSideQuestion).toHaveBeenCalledWith('what is 2+2?');
    });

    it('sets answer on success', async () => {
      const askSideQuestion = vi.fn().mockResolvedValue({ ok: true, data: { answer: '4' } });
      const feature = createBtwFeature({ askSideQuestion });
      feature.slash?.invoke('/btw what is 2+2?');
      await vi.waitFor(() => expect(btwSignal.getState().loading).toBe(false));
      expect(btwSignal.getState()).toMatchObject({ answer: '4', error: null });
    });

    it('sets error on RPC failure', async () => {
      const askSideQuestion = vi.fn().mockResolvedValue({ ok: false, error: 'timeout' });
      const feature = createBtwFeature({ askSideQuestion });
      feature.slash?.invoke('/btw what is 2+2?');
      await vi.waitFor(() => expect(btwSignal.getState().loading).toBe(false));
      expect(btwSignal.getState()).toMatchObject({ error: 'timeout', answer: null });
    });

    it('sets error on exception', async () => {
      const askSideQuestion = vi.fn().mockRejectedValue(new Error('network'));
      const feature = createBtwFeature({ askSideQuestion });
      feature.slash?.invoke('/btw what is 2+2?');
      await vi.waitFor(() => expect(btwSignal.getState().loading).toBe(false));
      expect(btwSignal.getState()).toMatchObject({ error: 'network' });
    });
  });
});

describe('createBtwLocalFeature (per-render, disabled when no question)', () => {
  const baseFeature = createBtwFeature({ askSideQuestion: vi.fn() });

  it('is disabled when slashFilter has no btw question', () => {
    expect(createBtwLocalFeature({ slashFilter: null, baseFeature }).disabled).toBe(true);
    expect(createBtwLocalFeature({ slashFilter: '', baseFeature }).disabled).toBe(true);
    expect(createBtwLocalFeature({ slashFilter: 'btw', baseFeature }).disabled).toBe(true);
  });

  it('is enabled when slashFilter starts with "btw " and has a question', () => {
    const feat = createBtwLocalFeature({ slashFilter: 'btw hello', baseFeature });
    expect(feat.disabled).toBe(false);
  });

  it('execute invokes base slash with the extracted question', () => {
    const invoke = vi.fn();
    const base = {
      ...baseFeature,
      slash: { ...baseFeature.slash!, invoke },
    };
    const feat = createBtwLocalFeature({ slashFilter: 'btw what is 2+2?', baseFeature: base });
    feat.execute();
    expect(invoke).toHaveBeenCalledWith('/btw what is 2+2?');
  });

  it('execute is a no-op when disabled', () => {
    const invoke = vi.fn();
    const base = { ...baseFeature, slash: { ...baseFeature.slash!, invoke } };
    createBtwLocalFeature({ slashFilter: null, baseFeature: base }).execute();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('carries over id, label, category, and matchFirstToken from base', () => {
    const feat = createBtwLocalFeature({ slashFilter: 'btw x', baseFeature });
    expect(feat.id).toBe('btw');
    expect(feat.label).toBe('/btw');
    expect(feat.category).toBe('Slash Commands');
    expect(feat.ui?.matchFirstToken).toBe(true);
  });
});

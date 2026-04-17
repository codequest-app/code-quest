import { afterEach, describe, expect, it, vi } from 'vitest';
import { btwSignal, createBtwFeature } from '../btw-feature';

const CLOSED = { open: false, question: '', answer: null, loading: false, error: null };

afterEach(() => {
  btwSignal.setState(CLOSED);
});

describe('createBtwFeature', () => {
  describe('match', () => {
    const feature = createBtwFeature({ askSideQuestion: vi.fn() });

    it('matches /btw alone', () => {
      expect(feature.match?.('/btw')).toBe(true);
    });

    it('matches /btw with question', () => {
      expect(feature.match?.('/btw what is 2+2?')).toBe(true);
    });

    it('does not match /btwx', () => {
      expect(feature.match?.('/btwx')).toBe(false);
    });

    it('does not match /compact', () => {
      expect(feature.match?.('/compact')).toBe(false);
    });
  });

  describe('invoke', () => {
    it('does nothing when no question', () => {
      const askSideQuestion = vi.fn();
      const feature = createBtwFeature({ askSideQuestion });
      feature.invoke('/btw');
      expect(askSideQuestion).not.toHaveBeenCalled();
      expect(btwSignal.getState().open).toBe(false);
    });

    it('opens signal with loading state and calls RPC', () => {
      const askSideQuestion = vi.fn().mockResolvedValue({ ok: true, data: { answer: '4' } });
      const feature = createBtwFeature({ askSideQuestion });
      feature.invoke('/btw what is 2+2?');
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
      feature.invoke('/btw what is 2+2?');
      await vi.waitFor(() => expect(btwSignal.getState().loading).toBe(false));
      expect(btwSignal.getState()).toMatchObject({ answer: '4', error: null });
    });

    it('sets error on RPC failure', async () => {
      const askSideQuestion = vi.fn().mockResolvedValue({ ok: false, error: 'timeout' });
      const feature = createBtwFeature({ askSideQuestion });
      feature.invoke('/btw what is 2+2?');
      await vi.waitFor(() => expect(btwSignal.getState().loading).toBe(false));
      expect(btwSignal.getState()).toMatchObject({ error: 'timeout', answer: null });
    });

    it('sets error on exception', async () => {
      const askSideQuestion = vi.fn().mockRejectedValue(new Error('network'));
      const feature = createBtwFeature({ askSideQuestion });
      feature.invoke('/btw what is 2+2?');
      await vi.waitFor(() => expect(btwSignal.getState().loading).toBe(false));
      expect(btwSignal.getState()).toMatchObject({ error: 'network' });
    });
  });
});

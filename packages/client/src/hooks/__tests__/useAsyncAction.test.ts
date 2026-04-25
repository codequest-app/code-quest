import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAsyncAction } from '../useAsyncAction';

describe('useAsyncAction', () => {
  it('returns { run, pending } and pending is false initially', () => {
    const { result } = renderHook(() => useAsyncAction(async () => {}));
    expect(result.current.pending).toBe(false);
    expect(typeof result.current.run).toBe('function');
  });

  it('flips pending to true while the action is in flight, then back to false', async () => {
    let resolve: (() => void) | undefined;
    const fn = () =>
      new Promise<void>((r) => {
        resolve = r;
      });
    const { result } = renderHook(() => useAsyncAction(fn));

    let runPromise: Promise<void> = Promise.resolve();
    act(() => {
      runPromise = result.current.run();
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      resolve?.();
      await runPromise;
    });
    expect(result.current.pending).toBe(false);
  });

  it('pending also resets to false on rejection', async () => {
    let reject: ((e: unknown) => void) | undefined;
    const fn = () =>
      new Promise<void>((_, r) => {
        reject = r;
      });
    const { result } = renderHook(() => useAsyncAction(fn));
    let runPromise: Promise<void> = Promise.resolve();
    act(() => {
      runPromise = result.current.run();
    });
    expect(result.current.pending).toBe(true);
    await act(async () => {
      reject?.(new Error('boom'));
      await runPromise.catch(() => {});
    });
    expect(result.current.pending).toBe(false);
  });

  it('concurrent run() calls are deduped — second run is a no-op while first is in flight', async () => {
    let calls = 0;
    let resolve: (() => void) | undefined;
    const fn = () => {
      calls++;
      return new Promise<void>((r) => {
        resolve = r;
      });
    };
    const { result } = renderHook(() => useAsyncAction(fn));
    let p1: Promise<void> = Promise.resolve();
    act(() => {
      p1 = result.current.run();
    });
    act(() => {
      void result.current.run();
    });
    expect(calls).toBe(1);
    await act(async () => {
      resolve?.();
      await p1;
    });
  });
});

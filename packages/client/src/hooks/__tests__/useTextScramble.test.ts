import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FakeRaf } from '../../test/fake-raf';
import { useTextScramble } from '../useTextScramble';

describe('useTextScramble', () => {
  it('returns target text immediately on first render', () => {
    const raf = new FakeRaf();
    raf.install();

    const { result } = renderHook(() => useTextScramble('Hello...', 10));
    expect(result.current).toBe('Hello...  ');

    raf.uninstall();
  });

  it('shows ▌ cursor during scramble after target changes', () => {
    const raf = new FakeRaf();
    raf.install();

    const { result, rerender } = renderHook(({ target }) => useTextScramble(target, 10), {
      initialProps: { target: 'Hello...' },
    });

    // Change target — triggers scramble animation
    rerender({ target: 'World...' });

    // Fire one frame
    act(() => {
      raf.tick(40);
    });

    expect(result.current).toContain('▌');

    raf.uninstall();
  });

  it('settles to final text after enough frames', () => {
    const raf = new FakeRaf();
    raf.install();

    const { result, rerender } = renderHook(({ target }) => useTextScramble(target, 10), {
      initialProps: { target: 'Hello...' },
    });

    rerender({ target: 'World...' });

    // Fire enough frames to complete (10 chars × ~4 stages)
    act(() => {
      raf.tickFrames(30);
    });

    expect(result.current.trimEnd()).toBe('World...');

    raf.uninstall();
  });

  it('pads output to maxLen with spaces', () => {
    const raf = new FakeRaf();
    raf.install();

    const { result } = renderHook(() => useTextScramble('Hi', 8));
    expect(result.current).toBe('Hi      ');
    expect(result.current.length).toBe(8);

    raf.uninstall();
  });
});

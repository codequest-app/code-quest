import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInputHistory } from '../useInputHistory';

describe('useInputHistory', () => {
  it('push adds message to history', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('hello'));
    expect(result.current.history).toEqual(['hello']);
  });

  it('cycleUp returns previous message', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('first'));
    act(() => result.current.push('second'));

    const msg = result.current.cycleUp();
    expect(msg).toBe('second');
  });

  it('cycleUp twice returns older message', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('first'));
    act(() => result.current.push('second'));

    result.current.cycleUp();
    const msg = result.current.cycleUp();
    expect(msg).toBe('first');
  });

  it('cycleDown after cycleUp returns newer message', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('first'));
    act(() => result.current.push('second'));

    result.current.cycleUp();
    result.current.cycleUp();
    const msg = result.current.cycleDown();
    expect(msg).toBe('second');
  });

  it('cycleDown past newest returns empty string', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('first'));

    result.current.cycleUp();
    const msg = result.current.cycleDown();
    expect(msg).toBe('');
  });

  it('cycleUp on empty history returns null', () => {
    const { result } = renderHook(() => useInputHistory());
    const msg = result.current.cycleUp();
    expect(msg).toBeNull();
  });

  it('does not push duplicate consecutive messages', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('hello'));
    act(() => result.current.push('hello'));
    expect(result.current.history).toEqual(['hello']);
  });

  it('reset clears the navigation index', () => {
    const { result } = renderHook(() => useInputHistory());
    act(() => result.current.push('first'));
    act(() => result.current.push('second'));

    result.current.cycleUp();
    act(() => result.current.reset());
    const msg = result.current.cycleUp();
    expect(msg).toBe('second');
  });
});

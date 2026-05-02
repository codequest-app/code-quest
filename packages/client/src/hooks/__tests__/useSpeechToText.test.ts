import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpeechToText } from '../useSpeechToText.ts';

interface SpeechResult {
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
  resultIndex: number;
}

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  onresult: ((event: SpeechResult) => void) | null = null;
  onerror: ((event: Event & { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });
}

const win = window as unknown as Record<string, unknown>;

describe('useSpeechToText', () => {
  afterEach(() => {
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;
  });

  it('isSupported is false when SpeechRecognition not available', () => {
    const { result } = renderHook(() => useSpeechToText());
    expect(result.current.isSupported).toBe(false);
  });

  it('isSupported is true when SpeechRecognition available', () => {
    win.SpeechRecognition = MockSpeechRecognition;
    const { result } = renderHook(() => useSpeechToText());
    expect(result.current.isSupported).toBe(true);
  });

  it('isSupported is true when webkitSpeechRecognition available', () => {
    win.webkitSpeechRecognition = MockSpeechRecognition;
    const { result } = renderHook(() => useSpeechToText());
    expect(result.current.isSupported).toBe(true);
  });

  it('start begins listening', () => {
    win.SpeechRecognition = MockSpeechRecognition;
    const { result } = renderHook(() => useSpeechToText());

    act(() => result.current.start());

    expect(result.current.isListening).toBe(true);
  });

  it('stop ends listening', () => {
    win.SpeechRecognition = MockSpeechRecognition;
    const { result } = renderHook(() => useSpeechToText());

    act(() => result.current.start());
    expect(result.current.isListening).toBe(true);

    act(() => result.current.stop());
    expect(result.current.isListening).toBe(false);
  });

  it('sets finalTranscript from final results', () => {
    let instance: MockSpeechRecognition;
    win.SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    };

    const { result } = renderHook(() => useSpeechToText());

    act(() => result.current.start());

    act(() => {
      instance.onresult?.({
        results: Object.assign([{ isFinal: true, 0: { transcript: 'hello world' } }], {
          length: 1,
        }),
        resultIndex: 0,
      });
    });

    expect(result.current.finalTranscript).toBe('hello world');
  });

  it('sets interimTranscript from non-final results', () => {
    let instance: MockSpeechRecognition;
    win.SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    };

    const { result } = renderHook(() => useSpeechToText());

    act(() => result.current.start());

    act(() => {
      instance.onresult?.({
        results: Object.assign([{ isFinal: false, 0: { transcript: 'hello' } }], { length: 1 }),
        resultIndex: 0,
      });
    });

    expect(result.current.interimTranscript).toBe('hello');
    expect(result.current.finalTranscript).toBe('');
  });

  it('shows toast.error and stops on speech recognition error', () => {
    const toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => 'toast-id');
    let instance: MockSpeechRecognition;
    win.SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    };

    const { result } = renderHook(() => useSpeechToText());
    act(() => result.current.start());
    expect(result.current.isListening).toBe(true);

    act(() => {
      instance.onerror?.(Object.assign(new Event('error'), { error: 'network' }));
      instance.onend?.();
    });

    expect(toastErrorSpy).toHaveBeenCalledWith('Speech recognition error: network');
    expect(result.current.isListening).toBe(false);
    toastErrorSpy.mockRestore();
  });

  it('stops active recognition on unmount so dangling listeners do not leak', () => {
    let instance: MockSpeechRecognition | undefined;
    win.SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        instance = this;
      }
    };

    const { result, unmount } = renderHook(() => useSpeechToText());
    act(() => result.current.start());
    expect(instance?.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);

    unmount();
    expect(instance?.stop).toHaveBeenCalled();
  });
});

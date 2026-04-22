import { afterEach, beforeEach } from 'vitest';

type ResultEntry = { isFinal: boolean; transcript: string };

export class FakeSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult:
    | ((event: {
        resultIndex: number;
        results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
      }) => void)
    | null = null;
  onerror: ((event: Event) => void) | null = null;
  onend: (() => void) | null = null;
  start = () => {
    FakeSpeechRecognition.instances.push(this);
  };
  stop = () => {
    this.onend?.();
  };
  emit(entries: ResultEntry[]) {
    const results = entries.map((e) => ({ isFinal: e.isFinal, 0: { transcript: e.transcript } }));
    const list = Object.assign(results, { length: results.length });
    this.onresult?.({ resultIndex: 0, results: list as never });
  }
  static instances: FakeSpeechRecognition[] = [];
}

/** Install FakeSpeechRecognition on window for the current vitest describe()
 *  block. Each test gets a fresh instances array and the window property is
 *  removed after the test finishes. */
export function setupSpeechRecognition(): void {
  beforeEach(() => {
    FakeSpeechRecognition.instances = [];
    (window as unknown as { SpeechRecognition: typeof FakeSpeechRecognition }).SpeechRecognition =
      FakeSpeechRecognition;
  });
  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });
}

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionResultList = {
  length: number;
  [i: number]: SpeechRecognitionResult;
};
type SpeechRecognitionErrorEvent = Event & { error?: string };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionClass(): (new () => SpeechRecognitionInstance) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechToText(): {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  resetTranscript: () => void;
  toggleListening: () => void;
  start: () => void;
  stop: () => void;
  isSupported: boolean;
} {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const SpeechRecognitionClass = getSpeechRecognitionClass();
  const isSupported = SpeechRecognitionClass !== null;

  const resetTranscript = (): void => {
    setInterimTranscript('');
    setFinalTranscript('');
  };

  const start = (): void => {
    const SpeechRecognition = SpeechRecognitionClass;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) {
          final += alt.transcript;
        } else {
          interim += alt.transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = event.error ?? 'unknown';
      toast.error(`Speech recognition error: ${error}`);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stop = (): void => {
    recognitionRef.current?.stop();
  };

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  const toggleListening = (): void => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  return {
    isListening: isListening,
    interimTranscript: interimTranscript,
    finalTranscript: finalTranscript,
    resetTranscript: resetTranscript,
    toggleListening: toggleListening,
    start: start,
    stop: stop,
    isSupported: isSupported,
  };
}

import { useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { SpeechInputButton } from './SpeechInputButton';

interface SpeechInputContainerProps {
  onFinal: (text: string) => void;
  className?: string;
}

/** Isolates the speech-recognition subscription so interim-transcript updates
 *  re-render only this subtree, not the parent chat input area. `onFinal` must
 *  be a stable reference (e.g. from a context actions selector). */
export function SpeechInputContainer({ onFinal, className }: SpeechInputContainerProps) {
  const {
    isListening,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    toggleListening,
    isSupported,
  } = useSpeechToText();

  useEffect(() => {
    if (!finalTranscript) return;
    onFinal(finalTranscript);
    resetTranscript();
  }, [finalTranscript, onFinal, resetTranscript]);

  return (
    <SpeechInputButton
      isListening={isListening}
      onToggle={toggleListening}
      isSupported={isSupported}
      interimText={interimTranscript || undefined}
      className={className}
    />
  );
}

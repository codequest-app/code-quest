interface SpeechInputButtonProps {
  isListening: boolean;
  onToggle: () => void;
  isSupported: boolean;
  interimText?: string;
}

export function SpeechInputButton({
  isListening,
  onToggle,
  isSupported,
  interimText,
}: SpeechInputButtonProps) {
  if (!isSupported) return null;

  return (
    <div className="relative flex items-center">
      {interimText && (
        <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-xs italic text-text-muted bg-surface border border-border rounded px-2 py-1 whitespace-nowrap max-w-[200px] truncate pointer-events-none">
          {interimText}
        </span>
      )}
      <button
        type="button"
        aria-label={isListening ? 'Stop mic' : 'Start mic'}
        title={isListening ? 'Stop recording' : 'Start voice input'}
        onClick={onToggle}
        className="flex items-center justify-center w-7 h-7 rounded text-text-muted hover:text-text hover:bg-surface-hover transition-colors relative"
      >
        {isListening ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        ) : (
          <span>🎤</span>
        )}
      </button>
    </div>
  );
}

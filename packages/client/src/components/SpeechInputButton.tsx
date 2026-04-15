function MicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="7.5" y="2.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5 10a5 5 0 0 0 10 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="15"
        x2="10"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="17.5"
        x2="13"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
        className="w-[26px] h-[26px] flex items-center justify-center rounded text-text-bright hover:bg-white/5 transition-colors relative"
      >
        {isListening ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        ) : (
          <MicIcon />
        )}
      </button>
    </div>
  );
}

import { useState } from 'react';

interface ElicitationDialogProps {
  requestId: string;
  prompt: string;
  inputType: 'text' | 'url' | 'select';
  options?: string[];
  url?: string;
  onSubmit: (requestId: string, answer: string) => void;
  onCancel: (requestId: string) => void;
}

export function ElicitationDialog({
  requestId,
  prompt,
  inputType,
  options = [],
  url,
  onSubmit,
  onCancel,
}: ElicitationDialogProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(requestId, value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text">Input Required</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            <p className="text-sm text-text">{prompt}</p>
            {inputType === 'url' && url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-accent underline truncate"
              >
                {url}
              </a>
            )}
            {inputType === 'select' && options.length > 0 ? (
              <select
                className="w-full bg-black/20 border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Select an option…</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={inputType === 'url' ? 'url' : 'text'}
                className="w-full bg-black/20 border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none"
                placeholder={inputType === 'url' ? 'https://' : 'Enter value…'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </div>
          <div className="flex gap-2 justify-end px-4 pb-4">
            <button
              type="button"
              onClick={() => onCancel(requestId)}
              className="px-3 py-1.5 text-xs text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-3 py-1.5 bg-accent text-white rounded text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

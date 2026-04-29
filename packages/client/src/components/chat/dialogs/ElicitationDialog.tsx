import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent } from '../../ui/Dialog';
import { TextField } from '../../ui/TextField';

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
}: ElicitationDialogProps): React.JSX.Element {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(requestId, value);
  };

  return (
    <Dialog open>
      <DialogContent title="Input Required" mandatory className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-3">
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
              className="w-full bg-input-overlay border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none"
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
            <TextField
              type={inputType === 'url' ? 'url' : 'text'}
              className="w-full py-1.5"
              placeholder={inputType === 'url' ? 'https://' : 'Enter value…'}
              value={value}
              onChange={setValue}
            />
          )}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => onCancel(requestId)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

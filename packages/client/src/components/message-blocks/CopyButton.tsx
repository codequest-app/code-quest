import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';

export function CopyButton({
  text,
  className,
  title = 'Copy',
}: {
  text: string;
  className?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      title={copied ? 'Copied!' : title}
    >
      {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
    </button>
  );
}

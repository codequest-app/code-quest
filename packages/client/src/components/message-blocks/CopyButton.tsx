import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';

/**
 * Shared styling for copy buttons that live inside a `group` parent and
 * only reveal on hover. Callers compose with their positioning and the
 * parent group's `group-hover:opacity-100` (or scoped variant).
 */
export const HOVER_COPY_BASE =
  'p-1 rounded text-text-muted hover:text-text hover:bg-surface-hover opacity-0 transition-opacity cursor-pointer';

export function CopyButton({
  text,
  getText,
  className,
  title = 'Copy',
  'data-testid': dataTestid,
}: {
  text?: string;
  getText?: () => string;
  className?: string;
  title?: string;
  'data-testid'?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    copyToClipboard(getText ? getText() : (text ?? ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      title={copied ? 'Copied!' : title}
      data-testid={dataTestid}
    >
      {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
    </button>
  );
}

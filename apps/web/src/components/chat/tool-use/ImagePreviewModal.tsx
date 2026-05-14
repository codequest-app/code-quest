import { useEffect } from 'react';

interface ImagePreviewModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImagePreviewModal({
  src,
  alt,
  onClose,
}: ImagePreviewModalProps): React.JSX.Element {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape key is handled via document keydown listener above
    <div
      role="dialog"
      aria-label={alt}
      className="fixed inset-0 z-modal flex items-center justify-center bg-overlay"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only; keyboard handled by parent */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

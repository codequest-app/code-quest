import { useState } from 'react';
import { ImagePreviewModal } from '@/components/chat/ui/ImagePreviewModal';
import { Badge } from '@/components/ui/Badge';
import { parseAttachments } from '@/utils/parse-attachments';
import { Expandable } from '../ui/Expandable';

export function UserTextContent({ content }: { content: string }): React.JSX.Element {
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);
  const { text, attachments } = parseAttachments(content);

  return (
    <>
      <Expandable maxHeight={600} defaultOpen>
        <div className="leading-relaxed whitespace-pre-wrap">
          {text}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((att) =>
                att.isImage ? (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by ImagePreviewModal's Escape listener
                  <img
                    key={att.name}
                    src={att.dataUrl}
                    alt={att.name}
                    className="max-h-32 rounded cursor-pointer"
                    onClick={() => setPreview({ src: att.dataUrl, alt: att.name })}
                  />
                ) : (
                  <Badge key={att.name} size="xs">
                    {att.name}
                  </Badge>
                ),
              )}
            </div>
          )}
        </div>
      </Expandable>
      {preview && (
        <ImagePreviewModal src={preview.src} alt={preview.alt} onClose={() => setPreview(null)} />
      )}
    </>
  );
}

export interface ParsedAttachment {
  name: string;
  dataUrl: string;
  isImage: boolean;
}

export interface ParseAttachmentsResult {
  text: string;
  attachments: ParsedAttachment[];
}

const ATTACHMENT_RE = /\[Attachment: ([^\]]+)\]\n(data:[^\n]+)/g;

export function parseAttachments(content: string): ParseAttachmentsResult {
  const attachments: ParsedAttachment[] = [];
  const raw = content.replace(ATTACHMENT_RE, (_match, name: string, dataUrl: string) => {
    const mimeType = dataUrl.match(/^data:([^;]+);/)?.[1] ?? '';
    attachments.push({ name, dataUrl, isImage: mimeType.startsWith('image/') });
    return '';
  });
  const text = raw.replace(/\n{3,}/g, '\n\n').trim();
  return { text, attachments };
}

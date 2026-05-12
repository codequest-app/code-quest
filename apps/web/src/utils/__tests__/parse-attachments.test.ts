import { describe, expect, it } from 'vitest';
import { parseAttachments } from '../parse-attachments';

const PNG_DATA = 'data:image/png;base64,abc123';
const PDF_DATA = 'data:application/pdf;base64,pdfdata';

describe('parseAttachments', () => {
  it('returns empty attachments and original text when no attachment blocks', () => {
    const result = parseAttachments('hello world');
    expect(result.attachments).toEqual([]);
    expect(result.text).toBe('hello world');
  });

  it('parses a single image attachment', () => {
    const content = `hello\n\n[Attachment: cat.png]\n${PNG_DATA}`;
    const result = parseAttachments(content);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0]).toEqual({ name: 'cat.png', dataUrl: PNG_DATA, isImage: true });
    expect(result.text).toBe('hello');
  });

  it('parses a PDF attachment as non-image', () => {
    const content = `see this\n\n[Attachment: report.pdf]\n${PDF_DATA}`;
    const result = parseAttachments(content);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0]).toEqual({
      name: 'report.pdf',
      dataUrl: PDF_DATA,
      isImage: false,
    });
    expect(result.text).toBe('see this');
  });

  it('parses multiple attachments', () => {
    const content = `text\n\n[Attachment: a.png]\n${PNG_DATA}\n\n[Attachment: b.pdf]\n${PDF_DATA}`;
    const result = parseAttachments(content);
    expect(result.attachments).toHaveLength(2);
    expect(result.attachments[0]?.name).toBe('a.png');
    expect(result.attachments[1]?.name).toBe('b.pdf');
    expect(result.text).toBe('text');
  });

  it('preserves text when attachment is in the middle', () => {
    const content = `before\n\n[Attachment: x.png]\n${PNG_DATA}\n\nafter`;
    const result = parseAttachments(content);
    expect(result.attachments).toHaveLength(1);
    expect(result.text.trim()).toBe('before\n\nafter');
  });

  it('returns empty text when content is only an attachment', () => {
    const content = `[Attachment: x.png]\n${PNG_DATA}`;
    const result = parseAttachments(content);
    expect(result.attachments).toHaveLength(1);
    expect(result.text.trim()).toBe('');
  });

  it('treats unknown mime type as non-image', () => {
    const content = `[Attachment: data.csv]\ndata:text/csv;base64,csvdata`;
    const result = parseAttachments(content);
    expect(result.attachments[0]?.isImage).toBe(false);
  });
});

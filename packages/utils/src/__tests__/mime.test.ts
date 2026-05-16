import { describe, expect, it } from 'vitest';
import {
  isMarkdownMime,
  isPdfMime,
  langForMime,
  langForPath,
  MIME,
  mimeForPath,
  pdfDataUri,
} from '../mime.ts';

describe('MIME', () => {
  it('exports standard MIME type strings', () => {
    expect(MIME.pdf).toBe('application/pdf');
    expect(MIME.markdown).toBe('text/markdown');
    expect(MIME.plain).toBe('text/plain');
    expect(MIME.png).toBe('image/png');
  });
});

describe('mimeForPath', () => {
  it('returns pdf as base64', () => {
    expect(mimeForPath('report.pdf')).toEqual({
      contentType: 'application/pdf',
      encoding: 'base64',
    });
  });

  it('returns markdown as utf-8', () => {
    expect(mimeForPath('README.md')).toEqual({ contentType: 'text/markdown', encoding: 'utf-8' });
  });

  it('returns plain text for unknown extension', () => {
    expect(mimeForPath('file.xyz')).toEqual({ contentType: 'text/plain', encoding: 'utf-8' });
  });

  it('handles uppercase extension', () => {
    expect(mimeForPath('IMAGE.PNG')).toEqual({ contentType: 'image/png', encoding: 'base64' });
  });
});

describe('langForPath', () => {
  it('returns typescript for .ts', () => {
    expect(langForPath('foo.ts')).toBe('typescript');
  });

  it('returns python for .py', () => {
    expect(langForPath('script.py')).toBe('python');
  });

  it('returns undefined for unknown extension', () => {
    expect(langForPath('file.xyz')).toBeUndefined();
  });
});

describe('langForMime', () => {
  it('returns markdown for text/markdown mime', () => {
    expect(langForMime('text/markdown', 'any.txt')).toBe('markdown');
  });

  it('falls back to path-based detection', () => {
    expect(langForMime('text/plain', 'script.py')).toBe('python');
  });

  it('returns undefined when neither mime nor path match', () => {
    expect(langForMime('text/plain', 'file.xyz')).toBeUndefined();
  });
});

describe('isPdfMime', () => {
  it('returns true for application/pdf', () => {
    expect(isPdfMime('application/pdf')).toBe(true);
  });

  it('returns false for other types', () => {
    expect(isPdfMime('text/plain')).toBe(false);
  });
});

describe('isMarkdownMime', () => {
  it('returns true for text/markdown', () => {
    expect(isMarkdownMime('text/markdown')).toBe(true);
  });

  it('returns false for other types', () => {
    expect(isMarkdownMime('text/html')).toBe(false);
  });
});

describe('pdfDataUri', () => {
  it('produces a valid data URI', () => {
    expect(pdfDataUri('abc123')).toBe('data:application/pdf;base64,abc123');
  });
});

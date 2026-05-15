import { CONTENT_TYPE } from '@code-quest/schemas';

const BINARY_EXT: Record<string, string> = {
  pdf: CONTENT_TYPE.pdf,
  png: CONTENT_TYPE.png,
  jpg: CONTENT_TYPE.jpeg,
  jpeg: CONTENT_TYPE.jpeg,
  gif: CONTENT_TYPE.gif,
  webp: CONTENT_TYPE.webp,
  ico: CONTENT_TYPE.ico,
  woff: CONTENT_TYPE.woff,
  woff2: CONTENT_TYPE.woff2,
  ttf: CONTENT_TYPE.ttf,
  eot: CONTENT_TYPE.eot,
  otf: CONTENT_TYPE.otf,
  zip: CONTENT_TYPE.zip,
  gz: CONTENT_TYPE.gz,
  tar: CONTENT_TYPE.tar,
};

const TEXT_EXT: Record<string, string> = {
  md: CONTENT_TYPE.markdown,
  markdown: CONTENT_TYPE.markdown,
  html: CONTENT_TYPE.html,
  htm: CONTENT_TYPE.html,
  css: CONTENT_TYPE.css,
  xml: CONTENT_TYPE.xml,
  svg: CONTENT_TYPE.svg,
};

export function mimeForPath(filePath: string): {
  contentType: string;
  encoding: 'utf-8' | 'base64';
} {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  if (ext in BINARY_EXT) return { contentType: BINARY_EXT[ext] as string, encoding: 'base64' };
  if (ext in TEXT_EXT) return { contentType: TEXT_EXT[ext] as string, encoding: 'utf-8' };
  return { contentType: CONTENT_TYPE.plain, encoding: 'utf-8' };
}

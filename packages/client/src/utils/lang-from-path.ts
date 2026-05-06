import { CONTENT_TYPE } from '@code-quest/shared';

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  sh: 'bash',
  bash: 'bash',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  css: 'css',
  html: 'html',
  toml: 'toml',
  sql: 'sql',
  xml: 'xml',
};

const CONTENT_TYPE_TO_LANG: Record<string, string> = {
  [CONTENT_TYPE.markdown]: 'markdown',
  [CONTENT_TYPE.html]: 'html',
  [CONTENT_TYPE.css]: 'css',
};

export function langFromPath(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_LANG[ext];
}

export function langFromContentType(contentType: string, filePath: string): string | undefined {
  return CONTENT_TYPE_TO_LANG[contentType] ?? langFromPath(filePath);
}

/**
 * Maps a filename to a Material Icon Theme Iconify name. Lookup order:
 *   1. Exact filename match (e.g. `package.json`, `Dockerfile`)
 *   2. Extension match (e.g. `.ts` → typescript)
 *   3. Generic fallback `material-icon-theme:file`
 *
 * Case-insensitive at every step.
 */

const PREFIX = 'material-icon-theme:';

const BY_FILENAME: Record<string, string> = {
  'package.json': 'nodejs',
  'package-lock.json': 'nodejs',
  'pnpm-lock.yaml': 'pnpm',
  'pnpm-workspace.yaml': 'pnpm',
  'tsconfig.json': 'tsconfig',
  dockerfile: 'docker',
  '.dockerignore': 'docker',
  '.gitignore': 'git',
  '.gitattributes': 'git',
  'readme.md': 'readme',
  license: 'certificate',
  'license.md': 'certificate',
};

const BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'react_ts',
  js: 'javascript',
  jsx: 'react',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'json',
  md: 'markdown',
  mdx: 'markdown',
  css: 'css',
  scss: 'sass',
  sass: 'sass',
  less: 'less',
  html: 'html',
  htm: 'html',
  svg: 'svg',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  ico: 'image',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'settings',
  xml: 'xml',
  sh: 'console',
  bash: 'console',
  zsh: 'console',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'h',
  hpp: 'h',
  sql: 'database',
  env: 'tune',
  lock: 'lock',
};

export function getFileIcon(name: string): string {
  const lower = name.toLowerCase();
  const byName = BY_FILENAME[lower];
  if (byName) return `${PREFIX}${byName}`;
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return `${PREFIX}file`;
  const ext = lower.slice(dot + 1);
  const byExt = BY_EXTENSION[ext];
  return `${PREFIX}${byExt ?? 'file'}`;
}

export type DiffLineKind = 'context' | 'add' | 'del' | 'hunk' | 'header' | 'meta';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
}

export interface DiffFile {
  path: string;
  isBinary: boolean;
  added: number;
  removed: number;
  lines: DiffLine[];
}

const FILE_HEADER_RE = /^diff --git a\/(.+?) b\/(.+)$/;

export function parseUnifiedDiff(input: string): DiffFile[] {
  if (!input.trim()) return [];
  const rows = input.split('\n');
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;

  for (const raw of rows) {
    const fileMatch = FILE_HEADER_RE.exec(raw);
    if (fileMatch) {
      if (current) files.push(current);
      current = { path: fileMatch[2] ?? '', isBinary: false, added: 0, removed: 0, lines: [] };
      current.lines.push({ kind: 'header', text: raw });
      continue;
    }
    if (!current) continue;
    if (raw.startsWith('Binary files')) {
      current.isBinary = true;
      current.lines.push({ kind: 'meta', text: raw });
      continue;
    }
    if (raw.startsWith('@@')) {
      current.lines.push({ kind: 'hunk', text: raw });
      continue;
    }
    if (raw.startsWith('+++') || raw.startsWith('---') || raw.startsWith('index ')) {
      current.lines.push({ kind: 'meta', text: raw });
      continue;
    }
    if (raw.startsWith('+')) {
      current.added += 1;
      current.lines.push({ kind: 'add', text: raw });
      continue;
    }
    if (raw.startsWith('-')) {
      current.removed += 1;
      current.lines.push({ kind: 'del', text: raw });
      continue;
    }
    current.lines.push({ kind: 'context', text: raw });
  }
  if (current) files.push(current);
  return files;
}

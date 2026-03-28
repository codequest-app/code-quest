import { createTwoFilesPatch, parsePatch } from 'diff';

export interface DiffEntry {
  filePath: string;
  oldContent: string;
  newContent: string;
}

export function generateUnifiedDiff(
  oldContent: string,
  newContent: string,
  filePath: string,
): string {
  return createTwoFilesPatch(`a/${filePath}`, `b/${filePath}`, oldContent, newContent);
}

export function extractNewContent(diffContent: string): string {
  return diffContent
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('---') &&
        !line.startsWith('+++') &&
        !line.startsWith('@@') &&
        !line.startsWith('-'),
    )
    .map((line) => (line.startsWith('+') ? line.slice(1) : line))
    .join('\n');
}

export function isDiff(content: string): boolean {
  try {
    return parsePatch(content).some((f) => f.hunks.length > 0);
  } catch {
    return false;
  }
}

export function parseDiffFileName(content: string): string | null {
  try {
    const [file] = parsePatch(content);
    if (!file?.newFileName) return null;
    if (file.newFileName === '/dev/null') return null;
    return file.newFileName.replace(/^b\//, '');
  } catch {
    return null;
  }
}

const HUNK_HEADER_PATTERN = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseHunkStart(line: string): { oldStart: number; newStart: number } | null {
  const match = HUNK_HEADER_PATTERN.exec(line);
  if (!match) return null;
  return { oldStart: Number(match[1]), newStart: Number(match[2]) };
}

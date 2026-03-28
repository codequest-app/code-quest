export interface SlashToken {
  query: string;
  start: number;
  end: number;
}

export function getSlashQuery(value: string, cursorPos: number): SlashToken | null {
  const regex = /(?:^|(?<=\s))\/([^\s/]*)/g;
  for (const match of value.matchAll(regex)) {
    const start = match.index;
    const end = start + match[0].length;
    if (cursorPos >= start && cursorPos <= end) {
      return { query: match[1], start, end };
    }
  }
  return null;
}

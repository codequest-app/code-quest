export function slugify(text: string, separator: '-' | '_' = '-'): string {
  const sep = separator;
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, sep)
    .replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '');
}

export function slugify(text: string, separator: '-' | '_' = '-'): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
}

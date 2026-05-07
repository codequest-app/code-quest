const TRIM_HYPHEN = /^-+|-+$/g;
const TRIM_UNDERSCORE = /^_+|_+$/g;

export function slugify(text: string, separator: '-' | '_' = '-'): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(separator === '-' ? TRIM_HYPHEN : TRIM_UNDERSCORE, '');
}

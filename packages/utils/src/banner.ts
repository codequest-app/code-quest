export interface BannerItem {
  icon?: string;
  key: string;
  value: string;
}

export function formatBanner(title: string, items: BannerItem[]): string {
  const maxKeyLen = items.reduce((max, item) => Math.max(max, item.key.length), 0);
  const lines = [
    '',
    `  \x1b[1m${title}\x1b[0m`,
    '',
    ...items.map((item) => {
      const icon = item.icon ?? '➜';
      const paddedKey = item.key.padEnd(maxKeyLen);
      return `  ${icon}  ${paddedKey}  ${item.value}`;
    }),
    '',
  ];
  return lines.join('\n');
}

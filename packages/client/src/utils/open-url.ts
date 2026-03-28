/** Unified URL opener — always opens in a new tab. Use this instead of window.open() directly. */
export function openUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

import ClipboardJS from 'clipboard';

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  ClipboardJS.copy(text);
}

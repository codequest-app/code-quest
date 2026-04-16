import ClipboardJS from 'clipboard';

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    try {
      ClipboardJS.copy(text);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

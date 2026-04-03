export function formatResetTime(resetsAt: string): string | null {
  try {
    const ms = new Date(resetsAt).getTime() - Date.now();
    if (ms <= 0) return 'soon';
    const min = Math.floor(ms / 60000);
    const hrs = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    if (min < 60) return `in ${min}m`;
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${days}d`;
  } catch {
    return null;
  }
}

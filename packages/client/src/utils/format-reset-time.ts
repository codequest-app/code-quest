import {
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
} from './time-constants';

export function formatResetTime(resetsAt: string): string | null {
  try {
    const ms = new Date(resetsAt).getTime() - Date.now();
    if (!(ms > 0)) return 'soon';
    const min = Math.floor(ms / MS_PER_MINUTE);
    const hrs = Math.floor(ms / MS_PER_HOUR);
    const days = Math.floor(ms / MS_PER_DAY);
    if (min < MINUTES_PER_HOUR) return `in ${min}m`;
    if (hrs < HOURS_PER_DAY) return `in ${hrs}h`;
    return `in ${days}d`;
  } catch {
    return null;
  }
}

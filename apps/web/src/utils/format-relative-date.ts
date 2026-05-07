import {
  DAYS_PER_MONTH_APPROX,
  DAYS_PER_YEAR_APPROX,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from './time-constants.ts';

export function formatRelativeDate(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const seconds = Math.floor(diffMs / MS_PER_SECOND);
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const days = Math.floor(hours / HOURS_PER_DAY);
  const months = Math.floor(days / DAYS_PER_MONTH_APPROX);
  const years = Math.floor(days / DAYS_PER_YEAR_APPROX);

  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
}

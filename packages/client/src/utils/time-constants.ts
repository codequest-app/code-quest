/** Seconds / minutes / hours / days constants shared by relative-time formatters. */

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;

export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

/** Approximate calendar month / year lengths for "Xmo / Xy ago" style relative dates. */
export const DAYS_PER_MONTH_APPROX = 30;
export const DAYS_PER_YEAR_APPROX = 365;

import { describe, expect, it } from 'vitest';
import { formatRelativeDate } from '../format-relative-date';

describe('formatRelativeDate', () => {
  const now = new Date('2026-03-31T12:00:00Z');

  it('returns "now" for less than 1 minute ago', () => {
    expect(formatRelativeDate(new Date('2026-03-31T11:59:30Z'), now)).toBe('now');
  });

  it('returns minutes for less than 1 hour ago', () => {
    expect(formatRelativeDate(new Date('2026-03-31T11:55:00Z'), now)).toBe('5m');
    expect(formatRelativeDate(new Date('2026-03-31T11:01:00Z'), now)).toBe('59m');
  });

  it('returns hours for less than 1 day ago', () => {
    expect(formatRelativeDate(new Date('2026-03-31T09:00:00Z'), now)).toBe('3h');
    expect(formatRelativeDate(new Date('2026-03-30T13:00:00Z'), now)).toBe('23h');
  });

  it('returns days for less than 30 days ago', () => {
    expect(formatRelativeDate(new Date('2026-03-30T12:00:00Z'), now)).toBe('1d');
    expect(formatRelativeDate(new Date('2026-03-24T12:00:00Z'), now)).toBe('7d');
    expect(formatRelativeDate(new Date('2026-03-02T12:00:00Z'), now)).toBe('29d');
  });

  it('returns months for 30+ days ago', () => {
    expect(formatRelativeDate(new Date('2026-03-01T12:00:00Z'), now)).toBe('1mo');
    expect(formatRelativeDate(new Date('2025-12-31T12:00:00Z'), now)).toBe('3mo');
  });

  it('returns years for 365+ days ago', () => {
    expect(formatRelativeDate(new Date('2025-03-31T12:00:00Z'), now)).toBe('1y');
    expect(formatRelativeDate(new Date('2024-03-31T12:00:00Z'), now)).toBe('2y');
  });

  it('accepts string dates', () => {
    expect(formatRelativeDate('2026-03-30T12:00:00Z', now)).toBe('1d');
  });
});

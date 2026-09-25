import { describe, it, expect } from 'vitest';
import { formatRelativeTime, formatConcreteTime } from '../shared/time';

describe('shared/time: relative formatting & concrete hover tooltips', () => {
  const baseMs = 1774390000000; // arbitrary reference timestamp

  describe('formatRelativeTime', () => {
    it('returns "just now" for dates within 60 seconds of now', () => {
      const dateStr = new Date(baseMs - 30 * 1000).toISOString();
      expect(formatRelativeTime(dateStr, baseMs)).toBe('just now');
    });

    it('returns "just now" for identical timestamp or future timestamps', () => {
      const nowStr = new Date(baseMs).toISOString();
      expect(formatRelativeTime(nowStr, baseMs)).toBe('just now');

      const futureStr = new Date(baseMs + 5000).toISOString();
      expect(formatRelativeTime(futureStr, baseMs)).toBe('just now');
    });

    it('returns "Xm ago" for minutes within the hour', () => {
      const dateStr1 = new Date(baseMs - 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr1, baseMs)).toBe('1m ago');

      const dateStr15 = new Date(baseMs - 15 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr15, baseMs)).toBe('15m ago');

      const dateStr59 = new Date(baseMs - 59 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr59, baseMs)).toBe('59m ago');
    });

    it('returns "Xh ago" for hours within the day', () => {
      const dateStr1 = new Date(baseMs - 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr1, baseMs)).toBe('1h ago');

      const dateStr5 = new Date(baseMs - 5 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr5, baseMs)).toBe('5h ago');

      const dateStr23 = new Date(baseMs - 23 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr23, baseMs)).toBe('23h ago');
    });

    it('returns "Xd ago" for days within a week (1-7 days)', () => {
      const dateStr1 = new Date(baseMs - 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr1, baseMs)).toBe('1d ago');

      const dateStr3 = new Date(baseMs - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr3, baseMs)).toBe('3d ago');

      const dateStr7 = new Date(baseMs - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(dateStr7, baseMs)).toBe('7d ago');
    });

    it('returns localized date string for timestamps older than 7 days', () => {
      const olderDate = new Date(baseMs - 10 * 24 * 60 * 60 * 1000);
      const dateStr = olderDate.toISOString();
      expect(formatRelativeTime(dateStr, baseMs)).toBe(olderDate.toLocaleDateString());
    });

    it('returns "just now" safely for invalid date strings', () => {
      expect(formatRelativeTime('not-a-valid-date', baseMs)).toBe('just now');
      expect(formatRelativeTime('', baseMs)).toBe('just now');
    });

    it('defaults nowMs to Date.now() when omitted', () => {
      const recent = new Date(Date.now() - 5000).toISOString();
      expect(formatRelativeTime(recent)).toBe('just now');
    });
  });

  describe('formatConcreteTime', () => {
    it('returns locale string for valid date ISO string', () => {
      const iso = '2026-09-24T18:30:00.000Z';
      expect(formatConcreteTime(iso)).toBe(new Date(iso).toLocaleString());
    });

    it('returns raw string safely when date is invalid', () => {
      expect(formatConcreteTime('invalid-date')).toBe('invalid-date');
    });
  });
});

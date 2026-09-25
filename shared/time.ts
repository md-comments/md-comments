/**
 * Canonical date and time formatting utilities across Markdown Comments interfaces.
 */

/**
 * Formats an ISO date string into a concise relative timestamp string
 * (e.g. "just now", "5m ago", "2h ago", "3d ago", or localized date if > 7 days).
 */
export function formatRelativeTime(dateStr: string, nowMs: number = Date.now()): string {
  const date = new Date(dateStr);
  const time = date.getTime();
  if (isNaN(time)) {
    return 'just now';
  }
  const diff = nowMs - time;
  if (diff < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'just now';
}

/**
 * Formats an ISO date string into a concrete, localized date-time representation
 * for use in hover tooltips (HTML title attributes).
 */
export function formatConcreteTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  return d.toLocaleString();
}

/**
 * Formats an ISO timestamp as a short relative string ("Just now",
 * "5m ago", "3h ago", "2d ago"), falling back to a plain date for
 * anything older than a week. No date library -- this is the only
 * relative-time need in the app, so a dependency isn't justified.
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return "";

  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSeconds < 60) return "Just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
}
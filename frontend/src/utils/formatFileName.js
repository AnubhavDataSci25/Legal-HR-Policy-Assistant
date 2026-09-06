/**
 * Truncates a filename for display while keeping the extension visible,
 * e.g. "quarterly-hr-policy-handbook-2026-final-v3.pdf" -> "quarterly-hr-po….pdf"
 * Full filename should still be set as the element's `title` attribute
 * for accessibility and hover-reveal.
 */
export function truncateFilename(name, maxLength = 28) {
  if (!name || name.length <= maxLength) return name;

  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex > -1 ? name.slice(dotIndex) : "";
  const base = dotIndex > -1 ? name.slice(0, dotIndex) : name;

  const keep = Math.max(4, maxLength - ext.length - 1);
  return `${base.slice(0, keep)}…${ext}`;
}
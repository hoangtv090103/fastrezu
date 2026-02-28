// ── Template System — Shared Utilities ────────────────────────────────────────

/** Format a date range: "Jan 2021 – Mar 2024" or just one date */
export function dateRange(start?: string | null, end?: string | null): string {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

/** Parse bullet-point text (•  or - prefixed, newline-separated) into string[] */
export function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

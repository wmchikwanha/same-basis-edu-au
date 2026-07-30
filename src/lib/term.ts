/** Shared term/week helpers used by both the browser and server code. */
export const TERM_START = new Date(2026, 6, 13); // Monday 13 July 2026

export function weekNumberFor(date: Date): number {
  const days = Math.floor((date.getTime() - TERM_START.getTime()) / 86_400_000);
  return Math.min(10, Math.max(1, Math.floor(days / 7) + 1));
}

export function newId(_prefix?: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Extremely rare fallback (very old browsers) — still uuid-shaped.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

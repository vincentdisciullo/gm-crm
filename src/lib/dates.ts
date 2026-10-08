// "Today" is computed in the owner's timezone so the Today view flips at local midnight,
// not at UTC midnight on the server.
const TIMEZONE = process.env.APP_TIMEZONE || "America/New_York";

/** YYYY-MM-DD for the given instant in the app timezone. */
export function isoDate(d: Date = new Date(), timeZone = TIMEZONE) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** "Oct 7" or "Oct 7, 2025" when not in the current year. */
export function formatDay(iso: string, today = isoDate()) {
  const [y, m, d] = iso.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return today.slice(0, 4) === iso.slice(0, 4) ? `${month} ${d}` : `${month} ${d}, ${y}`;
}

/** Accepts YYYY-MM-DD, M/D/YYYY, M/D/YY or anything Date.parse understands; returns YYYY-MM-DD or null. */
export function parseLooseDate(input: string | null | undefined): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (us) {
    const year = us[3].length === 2 ? 2000 + Number(us[3]) : Number(us[3]);
    return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

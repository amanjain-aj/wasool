// Date helpers. All business dates are plain "YYYY-MM-DD" strings in IST.
// Pure / client-safe.

const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+05:30
const DAY_MS = 86_400_000;

/** Today's calendar date in India (Asia/Kolkata). */
export function todayIST(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** Positive = days past due, 0 = due today, negative = days until due. */
export function daysOverdue(dueDate: string, today: string = todayIST()): number {
  return daysBetween(dueDate, today);
}

/** Timestamp for "<date> 10:30 AM IST" — the daily dispatch slot. */
export function dispatchSlotISO(date: string): string {
  return new Date(Date.parse(`${date}T10:30:00+05:30`)).toISOString();
}

export function formatDateIN(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Normalises common Indian spreadsheet date formats to YYYY-MM-DD.
 * Accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (day-first, Indian convention).
 */
export function parseFlexibleDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const str: string = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str) && isISODate(str)) return str;
  const m = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return isISODate(iso) ? iso : null;
  }
  return null;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

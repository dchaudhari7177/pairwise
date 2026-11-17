// Time helpers. "Days" in Pairwise are Indian calendar days (Asia/Kolkata),
// so picks refresh at midnight IST no matter where the server runs.

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
const IST_OFFSET = 5.5 * HOUR;

/** YYYY-MM-DD for the IST calendar day containing `ms`. */
export function istDay(ms: number = Date.now()): string {
  return new Date(ms + IST_OFFSET).toISOString().slice(0, 10);
}

/** Epoch ms of IST midnight that starts the given IST day. */
export function istDayStart(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`) - IST_OFFSET;
}

export function addDays(day: string, n: number): string {
  return istDay(istDayStart(day) + n * DAY + HOUR);
}

/** ISO week key such as 2026-W47, used for exposure counters. */
export function isoWeek(ms: number = Date.now()): string {
  const d = new Date(ms + IST_OFFSET);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 + Math.round(((target.getTime() - firstThursday.getTime()) / DAY - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Whole years between a birth date (YYYY-MM-DD) and `now`. */
export function ageFrom(birthDate: string, now: number = Date.now()): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const today = new Date(now + IST_OFFSET);
  let age = today.getUTCFullYear() - y;
  const beforeBirthday =
    today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function timeAgo(ms: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatIst(ms: number, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Date(ms).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    ...opts,
  });
}

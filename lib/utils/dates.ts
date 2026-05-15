import {
  differenceInCalendarDays,
  format,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRelativeDue(value: Date | string | null | undefined): {
  label: string;
  overdue: boolean;
} | null {
  const d = toDate(value);
  if (!d) return null;

  if (isToday(d)) return { label: "Today", overdue: false };
  if (isTomorrow(d)) return { label: "Tomorrow", overdue: false };
  if (isYesterday(d)) return { label: "Yesterday", overdue: true };

  const days = differenceInCalendarDays(d, new Date());
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, overdue: true };
  if (days <= 14) return { label: `in ${days}d`, overdue: false };

  return {
    label: format(d, isThisYear(d) ? "MMM d" : "MMM d, yyyy"),
    overdue: false,
  };
}

export function formatAbsolute(value: Date | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return format(d, "EEE, MMM d, yyyy");
}

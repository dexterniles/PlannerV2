import type { recurrenceFrequency } from "@/lib/db/schema";

export type RecurrenceFrequencyValue = (typeof recurrenceFrequency.enumValues)[number];

export type RecurrenceRule = {
  frequency: RecurrenceFrequencyValue;
  interval: number;
  daysOfWeek: number[] | null;
  endDate: Date | null;
  count: number | null;
};

export type ComputeOccurrencesInput = {
  anchor: Date;
  rule: RecurrenceRule;
  now: Date;
  windowDays?: number;
  existingDates?: Date[];
};

export function computeOccurrences({
  anchor,
  rule,
  now,
  windowDays = 14,
  existingDates = [],
}: ComputeOccurrencesInput): Date[] {
  const windowEnd = addUTCDays(now, windowDays);
  const existingSet = new Set(existingDates.map((d) => d.getTime()));
  const results: Date[] = [];
  const limit = rule.count ?? Number.MAX_SAFE_INTEGER;
  const endDateBucket =
    rule.endDate === null ? null : utcDateBucket(rule.endDate);

  let enumerated = 0;
  for (const occ of enumerate(anchor, rule)) {
    if (enumerated >= limit) break;
    enumerated++;
    if (endDateBucket !== null && utcDateBucket(occ) > endDateBucket) break;
    if (occ.getTime() > windowEnd.getTime()) break;
    if (occ.getTime() < now.getTime()) continue;
    if (existingSet.has(occ.getTime())) continue;
    results.push(occ);
  }

  return results;
}

function* enumerate(anchor: Date, rule: RecurrenceRule): Generator<Date> {
  switch (rule.frequency) {
    case "daily": {
      let cur = new Date(anchor);
      while (true) {
        yield new Date(cur);
        cur = addUTCDays(cur, rule.interval);
      }
    }
    case "weekly":
    case "biweekly": {
      const weekStep =
        rule.frequency === "biweekly" ? 2 * rule.interval : rule.interval;
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dows = [...rule.daysOfWeek].sort((a, b) => a - b);
        let weekStart = addUTCDays(anchor, -anchor.getUTCDay());
        while (true) {
          for (const dow of dows) {
            const candidate = addUTCDays(weekStart, dow);
            candidate.setUTCHours(
              anchor.getUTCHours(),
              anchor.getUTCMinutes(),
              anchor.getUTCSeconds(),
              anchor.getUTCMilliseconds(),
            );
            if (candidate.getTime() < anchor.getTime()) continue;
            yield candidate;
          }
          weekStart = addUTCDays(weekStart, weekStep * 7);
        }
      } else {
        let cur = new Date(anchor);
        while (true) {
          yield new Date(cur);
          cur = addUTCDays(cur, weekStep * 7);
        }
      }
    }
    case "monthly": {
      const anchorDay = anchor.getUTCDate();
      let offset = 0;
      while (true) {
        const rawMonth = anchor.getUTCMonth() + offset * rule.interval;
        const yearShift = Math.floor(rawMonth / 12);
        const month = ((rawMonth % 12) + 12) % 12;
        const year = anchor.getUTCFullYear() + yearShift;
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const day = Math.min(anchorDay, daysInMonth);
        yield new Date(
          Date.UTC(
            year,
            month,
            day,
            anchor.getUTCHours(),
            anchor.getUTCMinutes(),
            anchor.getUTCSeconds(),
            anchor.getUTCMilliseconds(),
          ),
        );
        offset++;
      }
    }
    case "custom":
      return;
  }
}

function addUTCDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function utcDateBucket(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// ---------------------------------------------------------------------------
// Materializer (DB-backed) — wired up in Phase 11 (cron handler).
// The cron handler in /api/cron/auto-complete imports this and feeds it the
// userId for each user. It reads parent rows with non-null recurrence_rule_id,
// passes (anchor, rule, now, existingDates) to computeOccurrences, and inserts
// the returned occurrences as new child rows on the same parent table.
// ---------------------------------------------------------------------------

export async function materializeRecurrencesForUser(
  _userId: string,
  _now: Date = new Date(),
): Promise<{ inserted: number }> {
  void _userId;
  void _now;
  throw new Error("materializeRecurrencesForUser is wired up in Phase 11");
}

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import {
  computeOccurrences,
  type RecurrenceRule,
} from "./recurrence";

const utc = (
  y: number,
  m: number,
  d: number,
  h = 0,
  min = 0,
  s = 0,
): Date => new Date(Date.UTC(y, m - 1, d, h, min, s));

const toIso = (d: Date) => d.toISOString();

const baseRule = (overrides: Partial<RecurrenceRule> = {}): RecurrenceRule => ({
  frequency: "weekly",
  interval: 1,
  daysOfWeek: null,
  endDate: null,
  count: null,
  ...overrides,
});

describe("computeOccurrences", () => {
  it("weekly rule across US DST-forward (anchor 2025-03-09)", () => {
    const anchor = utc(2025, 3, 9, 10);
    const rule = baseRule({ frequency: "weekly", interval: 1 });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 14,
    });
    assert.deepEqual(got.map(toIso), [
      "2025-03-09T10:00:00.000Z",
      "2025-03-16T10:00:00.000Z",
      "2025-03-23T10:00:00.000Z",
    ]);
  });

  it("weekly rule across US DST-backward (anchor 2025-11-02)", () => {
    const anchor = utc(2025, 11, 2, 10);
    const rule = baseRule({ frequency: "weekly", interval: 1 });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 14,
    });
    assert.deepEqual(got.map(toIso), [
      "2025-11-02T10:00:00.000Z",
      "2025-11-09T10:00:00.000Z",
      "2025-11-16T10:00:00.000Z",
    ]);
  });

  it("monthly day-31 clamps Feb to 28 and 29 in leap year, restores 31 in March", () => {
    const anchor = utc(2024, 1, 31, 10);
    const rule = baseRule({ frequency: "monthly", interval: 1 });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 70,
    });
    assert.deepEqual(got.map(toIso), [
      "2024-01-31T10:00:00.000Z",
      "2024-02-29T10:00:00.000Z",
      "2024-03-31T10:00:00.000Z",
    ]);

    // Same anchor day on a non-leap year
    const nonLeapAnchor = utc(2025, 1, 31, 10);
    const gotNonLeap = computeOccurrences({
      anchor: nonLeapAnchor,
      rule,
      now: nonLeapAnchor,
      windowDays: 70,
    });
    assert.deepEqual(gotNonLeap.map(toIso), [
      "2025-01-31T10:00:00.000Z",
      "2025-02-28T10:00:00.000Z",
      "2025-03-31T10:00:00.000Z",
    ]);
  });

  it("monthly rule with mid-month end_date respects it inclusively", () => {
    const anchor = utc(2024, 1, 15, 10);
    const rule = baseRule({
      frequency: "monthly",
      interval: 1,
      endDate: utc(2024, 3, 20),
    });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 120,
    });
    assert.deepEqual(got.map(toIso), [
      "2024-01-15T10:00:00.000Z",
      "2024-02-15T10:00:00.000Z",
      "2024-03-15T10:00:00.000Z",
    ]);
  });

  it("count-limited rule (count=5) stops after 5 even if window allows more", () => {
    const anchor = utc(2024, 1, 1, 10);
    const rule = baseRule({
      frequency: "weekly",
      interval: 1,
      count: 5,
    });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 365,
    });
    assert.equal(got.length, 5);
    assert.deepEqual(got.map(toIso), [
      "2024-01-01T10:00:00.000Z",
      "2024-01-08T10:00:00.000Z",
      "2024-01-15T10:00:00.000Z",
      "2024-01-22T10:00:00.000Z",
      "2024-01-29T10:00:00.000Z",
    ]);
  });

  it("weekly with days_of_week=[1,3,5] emits only Mon/Wed/Fri", () => {
    const anchor = utc(2024, 1, 1, 10); // Monday
    const rule = baseRule({
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [1, 3, 5],
    });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 10,
    });
    assert.deepEqual(got.map(toIso), [
      "2024-01-01T10:00:00.000Z", // Mon
      "2024-01-03T10:00:00.000Z", // Wed
      "2024-01-05T10:00:00.000Z", // Fri
      "2024-01-08T10:00:00.000Z", // Mon
      "2024-01-10T10:00:00.000Z", // Wed
    ]);
    // Every emitted date must be Mon (1), Wed (3), or Fri (5)
    for (const d of got) {
      assert.ok(
        [1, 3, 5].includes(d.getUTCDay()),
        `unexpected weekday ${d.getUTCDay()} for ${toIso(d)}`,
      );
    }
  });

  it("Feb 29 leap-year anchor renders correctly; subsequent non-leap years clamp", () => {
    const anchor = utc(2024, 2, 29, 10);
    const rule = baseRule({ frequency: "monthly", interval: 12 });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 365 * 2,
    });
    // 730 days covers Feb 28 of two consecutive non-leap years; both clamp.
    assert.deepEqual(got.map(toIso), [
      "2024-02-29T10:00:00.000Z",
      "2025-02-28T10:00:00.000Z",
      "2026-02-28T10:00:00.000Z",
    ]);
  });

  it("idempotency: running twice with the same now produces zero new rows the second time", () => {
    const anchor = utc(2024, 1, 1, 10);
    const rule = baseRule({ frequency: "weekly", interval: 1 });
    const firstRun = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 14,
    });
    assert.ok(firstRun.length > 0);
    const secondRun = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 14,
      existingDates: firstRun,
    });
    assert.deepEqual(secondRun, []);
  });

  it("empty rule (no end_date, no count, weekly) caps generation at the 14-day window", () => {
    const anchor = utc(2024, 1, 1, 10);
    const rule = baseRule({ frequency: "weekly", interval: 1 });
    const got = computeOccurrences({
      anchor,
      rule,
      now: anchor,
      windowDays: 14,
    });
    assert.deepEqual(got.map(toIso), [
      "2024-01-01T10:00:00.000Z",
      "2024-01-08T10:00:00.000Z",
      "2024-01-15T10:00:00.000Z",
    ]);
  });
});

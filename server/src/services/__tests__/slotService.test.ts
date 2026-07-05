import { describe, it, expect, afterEach, vi } from "vitest";
import { DateTime } from "luxon";
import { computeFreeSlots } from "../slotService.js";

const MSK = "Europe/Moscow";
const LONDON = "Europe/London";
const MONDAY = "2026-07-06T00:00:00Z";
const TUESDAY = "2026-07-07T00:00:00Z";
const WEDNESDAY = "2026-07-08T00:00:00Z";
const MAR28 = "2026-03-28T00:00:00Z";
const MAR31 = "2026-03-31T00:00:00Z";

describe("computeFreeSlots", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates slots from a single availability window", () => {
    const slots = computeFreeSlots({
      availability: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      duration: 60,
      existingBookings: [],
      from: DateTime.fromISO(MONDAY, { zone: "utc" }),
      to: DateTime.fromISO(TUESDAY, { zone: "utc" }),
      timezone: MSK,
      minimumBookingNotice: 0,
    });

    expect(slots).toHaveLength(8);
    expect(slots[0]).toEqual({ start: "2026-07-06T06:00:00.000Z", end: "2026-07-06T07:00:00.000Z" });
    expect(slots[7]).toEqual({ start: "2026-07-06T13:00:00.000Z", end: "2026-07-06T14:00:00.000Z" });
  });

  it("excludes slots that overlap with existing bookings", () => {
    const slots = computeFreeSlots({
      availability: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      duration: 60,
      existingBookings: [
        { startTime: "2026-07-06T07:00:00.000Z", endTime: "2026-07-06T08:00:00.000Z" },
        { startTime: "2026-07-06T11:00:00.000Z", endTime: "2026-07-06T13:00:00.000Z" },
      ],
      from: DateTime.fromISO(MONDAY, { zone: "utc" }),
      to: DateTime.fromISO(TUESDAY, { zone: "utc" }),
      timezone: MSK,
      minimumBookingNotice: 0,
    });

    const starts = slots.map((s) => s.start);
    expect(starts).not.toContain("2026-07-06T07:00:00.000Z");
    expect(starts).not.toContain("2026-07-06T11:00:00.000Z");
    expect(starts).not.toContain("2026-07-06T12:00:00.000Z");
    expect(slots).toHaveLength(5);
  });

  it("skips slots before the minimum booking notice cutoff", () => {
    vi.setSystemTime(new Date("2026-07-06T04:00:00Z"));

    const slots = computeFreeSlots({
      availability: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      duration: 60,
      existingBookings: [],
      from: DateTime.fromISO(MONDAY, { zone: "utc" }),
      to: DateTime.fromISO(TUESDAY, { zone: "utc" }),
      timezone: MSK,
      minimumBookingNotice: 240,
    });

    const starts = slots.map((s) => s.start);
    expect(starts[0]).toBe("2026-07-06T08:00:00.000Z");
    expect(starts).not.toContain("2026-07-06T06:00:00.000Z");
    expect(starts).not.toContain("2026-07-06T07:00:00.000Z");
  });

  it("handles DST transition correctly", () => {
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));

    const slots = computeFreeSlots({
      availability: [
        { dayOfWeek: 6, start: "09:00", end: "10:00" },
        { dayOfWeek: 1, start: "09:00", end: "10:00" },
      ],
      duration: 60,
      existingBookings: [],
      from: DateTime.fromISO(MAR28, { zone: "utc" }),
      to: DateTime.fromISO(MAR31, { zone: "utc" }),
      timezone: LONDON,
      minimumBookingNotice: 0,
    });

    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ start: "2026-03-28T09:00:00.000Z", end: "2026-03-28T10:00:00.000Z" });
    expect(slots[1]).toEqual({ start: "2026-03-30T08:00:00.000Z", end: "2026-03-30T09:00:00.000Z" });
  });

  it("returns empty array when no availability for the day", () => {
    const slots = computeFreeSlots({
      availability: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      duration: 60,
      existingBookings: [],
      from: DateTime.fromISO(TUESDAY, { zone: "utc" }),
      to: DateTime.fromISO(WEDNESDAY, { zone: "utc" }),
      timezone: MSK,
      minimumBookingNotice: 0,
    });

    expect(slots).toHaveLength(0);
  });

  it("trims partial slots at window boundaries", () => {
    const slots = computeFreeSlots({
      availability: [{ dayOfWeek: 1, start: "09:00", end: "10:30" }],
      duration: 60,
      existingBookings: [],
      from: DateTime.fromISO(MONDAY, { zone: "utc" }),
      to: DateTime.fromISO(TUESDAY, { zone: "utc" }),
      timezone: MSK,
      minimumBookingNotice: 0,
    });

    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: "2026-07-06T06:00:00.000Z", end: "2026-07-06T07:00:00.000Z" });
  });

  it("handles edge case: slot exactly equals window", () => {
    const slots = computeFreeSlots({
      availability: [{ dayOfWeek: 1, start: "09:00", end: "10:00" }],
      duration: 60,
      existingBookings: [],
      from: DateTime.fromISO(MONDAY, { zone: "utc" }),
      to: DateTime.fromISO(TUESDAY, { zone: "utc" }),
      timezone: MSK,
      minimumBookingNotice: 0,
    });

    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: "2026-07-06T06:00:00.000Z", end: "2026-07-06T07:00:00.000Z" });
  });
});

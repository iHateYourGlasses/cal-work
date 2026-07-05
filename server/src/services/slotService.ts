import { DateTime } from "luxon";

export interface AvailabilityRule {
  dayOfWeek: number;
  start: string;
  end: string;
}

export interface ExistingBooking {
  startTime: string;
  endTime: string;
}

export interface Slot {
  start: string;
  end: string;
}

export function computeFreeSlots(params: {
  availability: AvailabilityRule[];
  duration: number;
  existingBookings: ExistingBooking[];
  from: DateTime;
  to: DateTime;
  timezone: string;
  minimumBookingNotice: number;
}): Slot[] {
  const { availability, duration, existingBookings, from, to, timezone, minimumBookingNotice } = params;

  const cutoffTime = DateTime.utc().plus({ minutes: minimumBookingNotice });

  const slots: Slot[] = [];
  let current = from.startOf("day");
  const lastDay = to.startOf("day");

  while (current <= lastDay) {
    const inHostTz = current.setZone(timezone);
    const dayOfWeek = inHostTz.weekday;

    const rules = availability.filter((r) => r.dayOfWeek === dayOfWeek);

    for (const rule of rules) {
      const [startH, startM] = rule.start.split(":").map(Number);
      const [endH, endM] = rule.end.split(":").map(Number);

      const windowStart = inHostTz.set({ hour: startH, minute: startM, second: 0, millisecond: 0 }).toUTC();
      const windowEnd = inHostTz.set({ hour: endH, minute: endM, second: 0, millisecond: 0 }).toUTC();

      let slotStart = windowStart;
      while (true) {
        const slotEnd = slotStart.plus({ minutes: duration });
        if (slotEnd > windowEnd) break;

        if (slotEnd > from && slotStart < to && slotStart >= cutoffTime) {
          const overlaps = existingBookings.some((b) => {
            const bStart = DateTime.fromISO(b.startTime, { zone: "utc" });
            const bEnd = DateTime.fromISO(b.endTime, { zone: "utc" });
            return slotStart < bEnd && slotEnd > bStart;
          });

          if (!overlaps) {
            slots.push({
              start: slotStart.toISO()!,
              end: slotEnd.toISO()!,
            });
          }
        }

        slotStart = slotStart.plus({ minutes: duration });
      }
    }

    current = current.plus({ days: 1 });
  }

  return slots;
}

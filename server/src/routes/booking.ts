import { Router } from "express";
import { eq, and, lt, gt } from "drizzle-orm";
import { DateTime } from "luxon";
import { getDb } from "../db/index.js";
import { users, eventTypes, availability, bookings, dateOverrides } from "../db/schema.js";
import { computeFreeSlots } from "../services/slotService.js";

export const bookingRouter = Router();

bookingRouter.get("/book/:username/:slug/slots", (req, res, next) => {
  try {
    const { username, slug } = req.params;
    const from = DateTime.fromISO(req.query.from as string, { zone: "utc" });
    const to = DateTime.fromISO(req.query.to as string, { zone: "utc" });

    if (!from.isValid || !to.isValid) {
      res.status(400).json({ message: "Invalid from/to query parameters" });
      return;
    }

    const user = getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const eventType = getDb()
      .select()
      .from(eventTypes)
      .where(
        and(
          eq(eventTypes.userId, username),
          eq(eventTypes.slug, slug),
        ),
      )
      .get();

    if (!eventType) {
      res.status(404).json({ message: "Event type not found" });
      return;
    }

    const avail = getDb()
      .select()
      .from(availability)
      .where(eq(availability.userId, username))
      .get();

    const existingBookings = getDb()
      .select({ startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(
        and(
          eq(bookings.eventTypeId, eventType.id),
          lt(bookings.startTime, to.toISO()!),
          gt(bookings.endTime, from.toISO()!),
        ),
      )
      .all();

    const overrides = getDb()
      .select({ date: dateOverrides.date, type: dateOverrides.type, start: dateOverrides.start, end: dateOverrides.end })
      .from(dateOverrides)
      .where(eq(dateOverrides.userId, username))
      .all();

    const slots = computeFreeSlots({
      availability: (avail?.slots as any[]) ?? [],
      duration: eventType.duration,
      existingBookings,
      from,
      to,
      minimumBookingNotice: eventType.minimumBookingNotice,
      timezone: user.timezone,
      dateOverrides: overrides.map((o) => ({
        date: o.date,
        type: o.type,
        start: o.start ?? undefined,
        end: o.end ?? undefined,
      })),
    });

    res.json({
      eventType: {
        id: eventType.id,
        title: eventType.title,
        slug: eventType.slug,
        description: eventType.description ?? undefined,
        duration: eventType.duration,
        userId: eventType.userId,
      },
      timezone: user.timezone,
      slots,
    });
  } catch (err) {
    next(err);
  }
});

bookingRouter.post("/book/:username/:slug", (req, res, next) => {
  try {
    const { username, slug } = req.params;
    const { startTime, guestName, guestEmail } = req.body;

    const user = getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const eventType = getDb()
      .select()
      .from(eventTypes)
      .where(
        and(
          eq(eventTypes.userId, username),
          eq(eventTypes.slug, slug),
        ),
      )
      .get();

    if (!eventType) {
      res.status(404).json({ message: "Event type not found" });
      return;
    }

    const slotStart = DateTime.fromISO(startTime, { zone: "utc" });
    const slotEnd = slotStart.plus({ minutes: eventType.duration });
    const now = DateTime.utc();

    if (slotStart < now.plus({ minutes: eventType.minimumBookingNotice })) {
      res.status(400).json({ message: "Slot is too soon. Minimum booking notice required." });
      return;
    }

    const overlapping = getDb()
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.eventTypeId, eventType.id),
          lt(bookings.startTime, slotEnd.toISO()!),
          gt(bookings.endTime, slotStart.toISO()!),
        ),
      )
      .get();

    if (overlapping) {
      res.status(409).json({ message: "This slot is already booked" });
      return;
    }

    const slotStartInHostTz = slotStart.setZone(user.timezone);
    const dateStr = slotStartInHostTz.toISODate()!;

    const override = getDb()
      .select()
      .from(dateOverrides)
      .where(
        and(
          eq(dateOverrides.userId, username),
          eq(dateOverrides.date, dateStr),
        ),
      )
      .get();

    if (override?.type === "blocked") {
      res.status(400).json({ message: "This date is blocked" });
      return;
    }

    if (override?.type === "custom" && override.start && override.end) {
      const slotEndInHostTz = slotEnd.setZone(user.timezone);
      const slotStartStr = slotStartInHostTz.toFormat("HH:mm");
      const slotEndStr = slotEndInHostTz.toFormat("HH:mm");

      if (slotStartStr < override.start || slotEndStr > override.end) {
        res.status(400).json({ message: "Slot is outside custom hours for this date" });
        return;
      }
    }

    const row = getDb()
      .insert(bookings)
      .values({
        eventTypeId: eventType.id,
        guestName,
        guestEmail,
        startTime: slotStart.toISO()!,
        endTime: slotEnd.toISO()!,
        createdAt: now.toISO()!,
      })
      .returning()
      .get();

    res.status(201).json({
      id: row.id,
      eventTypeId: row.eventTypeId,
      eventType: {
        id: eventType.id,
        title: eventType.title,
        slug: eventType.slug,
        description: eventType.description ?? undefined,
        duration: eventType.duration,
        userId: eventType.userId,
      },
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      startTime: row.startTime,
      endTime: row.endTime,
      createdAt: row.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

bookingRouter.get("/bookings", (req, res, next) => {
  try {
    const user = getDb().select().from(users).where(eq(users.username, "alex")).get();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const all = getDb()
      .select({
        booking: bookings,
        eventType: eventTypes,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(eventTypes.userId, "alex"))
      .orderBy(bookings.startTime)
      .all();

    res.json(
      all.map(({ booking, eventType }) => ({
        id: booking.id,
        eventTypeId: booking.eventTypeId,
        eventType: {
          id: eventType.id,
          title: eventType.title,
          slug: eventType.slug,
          description: eventType.description ?? undefined,
          duration: eventType.duration,
          userId: eventType.userId,
        },
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        startTime: booking.startTime,
        endTime: booking.endTime,
        createdAt: booking.createdAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

bookingRouter.get("/bookings/:bookingId", (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);

    const booking = getDb()
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .get();

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const eventType = getDb()
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .get();

    res.json({
      id: booking.id,
      eventTypeId: booking.eventTypeId,
      eventType: eventType
        ? {
            id: eventType.id,
            title: eventType.title,
            slug: eventType.slug,
            description: eventType.description ?? undefined,
            duration: eventType.duration,
            userId: eventType.userId,
          }
        : undefined,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: booking.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

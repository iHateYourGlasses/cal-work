import { Router } from "express";
import { eq, and, lt, gt } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../db/index.js";
import { users, eventTypes, availability, bookings } from "../db/schema.js";
import { computeFreeSlots, HOST_TIMEZONE } from "../services/slotService.js";

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

    const user = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const eventType = db
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

    const avail = db
      .select()
      .from(availability)
      .where(eq(availability.userId, username))
      .get();

    const existingBookings = db
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

    const slots = computeFreeSlots({
      availability: (avail?.slots as any[]) ?? [],
      duration: eventType.duration,
      existingBookings,
      from,
      to,
    });

    res.json({
      eventType: {
        id: eventType.id,
        title: eventType.title,
        slug: eventType.slug,
        description: eventType.description,
        duration: eventType.duration,
        userId: eventType.userId,
      },
      timezone: HOST_TIMEZONE,
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

    const user = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const eventType = db
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
    const now = DateTime.utc().toISO()!;

    const overlapping = db
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

    const row = db
      .insert(bookings)
      .values({
        eventTypeId: eventType.id,
        guestName,
        guestEmail,
        startTime: slotStart.toISO()!,
        endTime: slotEnd.toISO()!,
        createdAt: now,
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
        description: eventType.description,
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
    const user = db.select().from(users).where(eq(users.username, "alex")).get();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const all = db
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
          description: eventType.description,
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

    const booking = db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .get();

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const eventType = db
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
            description: eventType.description,
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

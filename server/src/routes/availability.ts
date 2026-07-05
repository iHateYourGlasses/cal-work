import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { availability, dateOverrides } from "../db/schema.js";

const HARDCODED_USER = "alex";

export const availabilityRouter = Router();

availabilityRouter.get("/", (_req, res, next) => {
  try {
    const row = getDb()
      .select()
      .from(availability)
      .where(eq(availability.userId, HARDCODED_USER))
      .get();

    res.json({
      id: row?.id ?? 0,
      userId: HARDCODED_USER,
      slots: row?.slots ?? [],
    });
  } catch (err) {
    next(err);
  }
});

availabilityRouter.put("/", (req, res, next) => {
  try {
    const { slots } = req.body;

    const existing = getDb()
      .select()
      .from(availability)
      .where(eq(availability.userId, HARDCODED_USER))
      .get();

    if (existing) {
      getDb()
        .update(availability)
        .set({ slots })
        .where(eq(availability.userId, HARDCODED_USER))
        .run();
    } else {
      getDb()
        .insert(availability)
        .values({ userId: HARDCODED_USER, slots })
        .run();
    }

    const row = getDb()
      .select()
      .from(availability)
      .where(eq(availability.userId, HARDCODED_USER))
      .get();

    res.json({
      id: row?.id ?? 0,
      userId: HARDCODED_USER,
      slots: row?.slots ?? [],
    });
  } catch (err) {
    next(err);
  }
});

availabilityRouter.get("/overrides", (_req, res, next) => {
  try {
    const rows = getDb()
      .select()
      .from(dateOverrides)
      .where(eq(dateOverrides.userId, HARDCODED_USER))
      .all();

    res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        date: r.date,
        type: r.type,
        start: r.start ?? undefined,
        end: r.end ?? undefined,
      })),
    );
  } catch (err) {
    next(err);
  }
});

availabilityRouter.post("/overrides", (req, res, next) => {
  try {
    const { date, type, start, end } = req.body;

    const existing = getDb()
      .select()
      .from(dateOverrides)
      .where(
        and(
          eq(dateOverrides.userId, HARDCODED_USER),
          eq(dateOverrides.date, date),
        ),
      )
      .get();

    let row: typeof dateOverrides.$inferSelect;
    if (existing) {
      getDb()
        .update(dateOverrides)
        .set({ type, start: start ?? null, end: end ?? null })
        .where(eq(dateOverrides.id, existing.id))
        .run();
      row = { ...existing, type, start: start ?? null, end: end ?? null };
    } else {
      row = getDb()
        .insert(dateOverrides)
        .values({
          userId: HARDCODED_USER,
          date,
          type,
          start: start ?? null,
          end: end ?? null,
        })
        .returning()
        .get();
    }

    res.status(201).json({
      id: row.id,
      userId: row.userId,
      date: row.date,
      type: row.type,
      start: row.start ?? undefined,
      end: row.end ?? undefined,
    });
  } catch (err) {
    next(err);
  }
});

availabilityRouter.delete("/overrides/:overrideId", (req, res, next) => {
  try {
    const overrideId = Number(req.params.overrideId);

    const existing = getDb()
      .select()
      .from(dateOverrides)
      .where(eq(dateOverrides.id, overrideId))
      .get();

    if (!existing) {
      res.status(404).json({ message: "Date override not found" });
      return;
    }

    getDb()
      .delete(dateOverrides)
      .where(eq(dateOverrides.id, overrideId))
      .run();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

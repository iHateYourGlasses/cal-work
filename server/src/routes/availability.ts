import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { availability } from "../db/schema.js";

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

import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { eventTypes } from "../db/schema.js";

const HARDCODED_USER = "alex";

export const eventTypesRouter = Router();

eventTypesRouter.get("/", (_req, res, next) => {
  try {
    const rows = db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.userId, HARDCODED_USER))
      .all();

    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description,
        duration: r.duration,
        userId: r.userId,
      })),
    );
  } catch (err) {
    next(err);
  }
});

eventTypesRouter.post("/", (req, res, next) => {
  try {
    const { title, slug, description, duration } = req.body;

    const row = db
      .insert(eventTypes)
      .values({
        userId: HARDCODED_USER,
        title,
        slug,
        description: description ?? null,
        duration,
      })
      .returning()
      .get();

    res.status(201).json({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      duration: row.duration,
      userId: row.userId,
    });
  } catch (err) {
    next(err);
  }
});

eventTypesRouter.get("/:eventTypeId", (req, res, next) => {
  try {
    const id = Number(req.params.eventTypeId);

    const row = db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, id))
      .get();

    if (!row || row.userId !== HARDCODED_USER) {
      res.status(404).json({ message: "Event type not found" });
      return;
    }

    res.json({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      duration: row.duration,
      userId: row.userId,
    });
  } catch (err) {
    next(err);
  }
});

eventTypesRouter.patch("/:eventTypeId", (req, res, next) => {
  try {
    const id = Number(req.params.eventTypeId);
    const { title, description, duration } = req.body;

    const existing = db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, id))
      .get();

    if (!existing || existing.userId !== HARDCODED_USER) {
      res.status(404).json({ message: "Event type not found" });
      return;
    }

    const row = db
      .update(eventTypes)
      .set({
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        duration: duration ?? existing.duration,
      })
      .where(eq(eventTypes.id, id))
      .returning()
      .get();

    res.json({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      duration: row.duration,
      userId: row.userId,
    });
  } catch (err) {
    next(err);
  }
});

eventTypesRouter.delete("/:eventTypeId", (req, res, next) => {
  try {
    const id = Number(req.params.eventTypeId);

    const existing = db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.id, id))
      .get();

    if (!existing || existing.userId !== HARDCODED_USER) {
      res.status(404).json({ message: "Event type not found" });
      return;
    }

    db.delete(eventTypes).where(eq(eventTypes.id, id)).run();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

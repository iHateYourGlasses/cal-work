import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { getDb } from "../../db/index.js";
import { dateOverrides } from "../../db/schema.js";
import { createTestApp, setupTestDb } from "../../test/helpers.js";

const app = createTestApp();

beforeEach(() => {
  vi.useRealTimers();
  setupTestDb();
});

describe("GET /api/availability/overrides", () => {
  it("returns empty array when no overrides exist", async () => {
    const res = await request(app).get("/api/availability/overrides");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all overrides for the hardcoded user", async () => {
    const db = getDb();
    db.insert(dateOverrides)
      .values({
        userId: "alex",
        date: "2026-07-06",
        type: "blocked",
        start: null,
        end: null,
      })
      .run();

    db.insert(dateOverrides)
      .values({
        userId: "alex",
        date: "2026-07-07",
        type: "custom",
        start: "12:00",
        end: "14:00",
      })
      .run();

    const res = await request(app).get("/api/availability/overrides");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].date).toBe("2026-07-06");
    expect(res.body[0].type).toBe("blocked");
    expect(res.body[1].date).toBe("2026-07-07");
    expect(res.body[1].type).toBe("custom");
  });
});

describe("POST /api/availability/overrides", () => {
  it("creates a new date override", async () => {
    const res = await request(app)
      .post("/api/availability/overrides")
      .send({
        date: "2026-07-06",
        type: "blocked",
      });

    expect(res.status).toBe(201);
    expect(res.body.date).toBe("2026-07-06");
    expect(res.body.type).toBe("blocked");
    expect(res.body.userId).toBe("alex");
    expect(res.body).toHaveProperty("id");

    const all = await request(app).get("/api/availability/overrides");
    expect(all.body).toHaveLength(1);
  });

  it("upserts an override when the same date is posted again", async () => {
    await request(app)
      .post("/api/availability/overrides")
      .send({ date: "2026-07-06", type: "blocked" });

    const res = await request(app)
      .post("/api/availability/overrides")
      .send({ date: "2026-07-06", type: "custom", start: "10:00", end: "12:00" });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("custom");
    expect(res.body.start).toBe("10:00");
    expect(res.body.end).toBe("12:00");

    const all = await request(app).get("/api/availability/overrides");
    expect(all.body).toHaveLength(1);
  });
});

describe("DELETE /api/availability/overrides/:overrideId", () => {
  it("deletes an existing override and returns 204", async () => {
    const db = getDb();
    const row = db
      .insert(dateOverrides)
      .values({ userId: "alex", date: "2026-07-06", type: "blocked", start: null, end: null })
      .returning()
      .get();

    const res = await request(app).delete(
      `/api/availability/overrides/${row.id}`,
    );

    expect(res.status).toBe(204);

    const all = await request(app).get("/api/availability/overrides");
    expect(all.body).toHaveLength(0);
  });

  it("returns 404 when deleting a non-existent override", async () => {
    const res = await request(app).delete("/api/availability/overrides/9999");

    expect(res.status).toBe(404);
  });
});

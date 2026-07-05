import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { getDb } from "../../db/index.js";
import { users, eventTypes, availability, bookings } from "../../db/schema.js";
import { createTestApp } from "../../test/helpers.js";
import { setupTestDb } from "../../test/helpers.js";

const FROM = "2026-07-06T00%3A00%3A00Z";
const TO = "2026-07-07T00%3A00%3A00Z";
const SLOT_7_8 = "2026-07-06T08:00:00.000Z";
const BOOKED_7_8 = "2026-07-06T07:00:00.000Z";
const BOOKED_END_7_8 = "2026-07-06T08:00:00.000Z";

const app = createTestApp();

beforeEach(() => {
  vi.useRealTimers();
  setupTestDb();
});

describe("GET /api/book/:username/:slug/slots", () => {
  it("returns 404 for unknown username", async () => {
    const res = await request(app).get(
      `/api/book/unknown/some-slug/slots?from=${FROM}&to=${TO}`,
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown slug", async () => {
    const res = await request(app).get(
      `/api/book/alex/unknown-slug/slots?from=${FROM}&to=${TO}`,
    );

    expect(res.status).toBe(404);
  });

  it("returns free slots for a valid event type with availability", async () => {
    const db = getDb();

    db.insert(eventTypes)
      .values({
        userId: "alex",
        title: "Meeting",
        slug: "meeting",
        description: null,
        duration: 60,
      })
      .run();

    db.insert(availability)
      .values({
        userId: "alex",
        slots: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      })
      .run();

    const res = await request(app).get(
      `/api/book/alex/meeting/slots?from=${FROM}&to=${TO}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.slots).toHaveLength(8);
    expect(res.body.eventType.title).toBe("Meeting");
    expect(res.body.timezone).toBe("Europe/Moscow");
  });

  it("excludes slots already booked", async () => {
    const db = getDb();

    const et = db
      .insert(eventTypes)
      .values({
        userId: "alex",
        title: "Meeting",
        slug: "meeting",
        description: null,
        duration: 60,
      })
      .returning()
      .get();

    db.insert(availability)
      .values({
        userId: "alex",
        slots: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      })
      .run();

    db.insert(bookings)
      .values({
        eventTypeId: et.id,
        guestName: "Booked User",
        guestEmail: "[MASKED]",
        startTime: BOOKED_7_8,
        endTime: BOOKED_END_7_8,
        createdAt: "2026-07-05T00:00:00.000Z",
      })
      .run();

    const res = await request(app).get(
      `/api/book/alex/meeting/slots?from=${FROM}&to=${TO}`,
    );

    expect(res.status).toBe(200);
    const starts = res.body.slots.map((s: any) => s.start);
    expect(starts).not.toContain(BOOKED_7_8);
    expect(res.body.slots).toHaveLength(7);
  });
});

describe("POST /api/book/:username/:slug", () => {
  function seedEventTypeAndAvailability() {
    const db = getDb();

    db.insert(eventTypes)
      .values({
        userId: "alex",
        title: "Meeting",
        slug: "meeting",
        description: null,
        duration: 60,
      })
      .run();

    db.insert(availability)
      .values({
        userId: "alex",
        slots: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }],
      })
      .run();
  }

  it("creates a booking and returns 201", async () => {
    seedEventTypeAndAvailability();

    const res = await request(app)
      .post("/api/book/alex/meeting")
      .send({
        startTime: SLOT_7_8,
        guestName: "Test User",
        guestEmail: "test@example.com",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.guestName).toBe("Test User");
    expect(res.body.guestEmail).toBe("test@example.com");
    expect(res.body.startTime).toBe(SLOT_7_8);
    expect(res.body.endTime).toBe("2026-07-06T09:00:00.000Z");
    expect(res.body.eventType.title).toBe("Meeting");
  });

  it("returns 409 when slot is already taken", async () => {
    seedEventTypeAndAvailability();

    await request(app)
      .post("/api/book/alex/meeting")
      .send({
        startTime: SLOT_7_8,
        guestName: "First User",
        guestEmail: "first@example.com",
      });

    const res = await request(app)
      .post("/api/book/alex/meeting")
      .send({
        startTime: SLOT_7_8,
        guestName: "Second User",
        guestEmail: "second@example.com",
      });

    expect(res.status).toBe(409);
  });

  it("returns 400 when slot violates minimum booking notice", async () => {
    seedEventTypeAndAvailability();
    vi.setSystemTime(new Date("2026-07-06T06:00:00Z"));

    const res = await request(app)
      .post("/api/book/alex/meeting")
      .send({
        startTime: BOOKED_7_8,
        guestName: "Test User",
        guestEmail: "test@example.com",
      });

    expect(res.status).toBe(400);
  });
});

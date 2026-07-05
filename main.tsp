// ⚠️ THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR THE API.
// Edit models and routes HERE, then run `tsp compile .` to regenerate openapi.yaml.
// Do NOT edit openapi.yaml directly — it is auto-generated.
// Rule: main.tsp → tsp compile → openapi.yaml

import "@typespec/http";

using TypeSpec.Http;

// ═══════════════════════════════════════════════════════════════
// MODELS
// ═══════════════════════════════════════════════════════════════

/**
 * A host user. Only one user exists in MVP (hardcoded on the backend).
 */
model User {
  /** Unique username (e.g. "alex"). */
  @minLength(1)
  @maxLength(50)
  @pattern("^[a-z0-9-]+$")
  username: string;

  /** Display name (e.g. "Alex Sokolov"). */
  @minLength(1)
  @maxLength(100)
  displayName: string;

  /** IANA timezone identifier (e.g. "Europe/Moscow"). */
  timezone: string;
}

/**
 * A meeting template created by the host.
 */
model EventType {
  @visibility(Lifecycle.Read)
  id: safeint;

  /** Short title (e.g. "30 Minute Consultation"). */
  @minLength(1)
  @maxLength(200)
  title: string;

  /** URL-friendly identifier, unique per user (e.g. "30min"). */
  @minLength(1)
  @maxLength(50)
  @pattern("^[a-z0-9-]+$")
  slug: string;

  /** Optional longer description. */
  @maxLength(5000)
  description?: string;

  /** Meeting duration in minutes. */
  @minValue(15)
  @maxValue(60)
  duration: safeint;

  /** The user who owns this event type. */
  @visibility(Lifecycle.Read)
  userId: string;
}

/**
 * Weekly availability schedule for a host.
 */
model Availability {
  @visibility(Lifecycle.Read)
  id: safeint;

  /** The user this availability belongs to. */
  @visibility(Lifecycle.Read)
  userId: string;

  /** JSON array of time windows per day of week. */
  slots: AvailabilitySlot[];
}

/**
 * A single time window on a specific day of the week.
 */
model AvailabilitySlot {
  /** 1 = Monday … 7 = Sunday. */
  @minValue(1)
  @maxValue(7)
  dayOfWeek: safeint;

  /** Start time in HH:mm format (host's timezone). */
  @pattern("^([01]\\d|2[0-3]):[0-5]\\d$")
  start: string;

  /** End time in HH:mm format (host's timezone). */
  @pattern("^([01]\\d|2[0-3]):[0-5]\\d$")
  end: string;
}

/**
 * A booking made by a guest for a specific event type.
 */
model Booking {
  @visibility(Lifecycle.Read)
  id: safeint;

  /** The event type that was booked. */
  eventTypeId: safeint;
  eventType?: EventType;

  /** Guest's name. */
  @minLength(1)
  @maxLength(100)
  guestName: string;

  /** Guest's email. */
  @format("email")
  guestEmail: string;

  /** Booking start time in UTC. */
  startTime: utcDateTime;

  /** Booking end time in UTC. */
  endTime: utcDateTime;

  @visibility(Lifecycle.Read)
  createdAt: utcDateTime;
}

/**
 * A single free time slot returned by the slots endpoint.
 */
model TimeSlot {
  /** Slot start in UTC. */
  start: utcDateTime;

  /** Slot end in UTC. */
  end: utcDateTime;
}

// ═══════════════════════════════════════════════════════════════
// REQUEST / RESPONSE PAYLOADS
// ═══════════════════════════════════════════════════════════════

model EventTypeCreate {
  @minLength(1)
  @maxLength(200)
  title: string;

  @minLength(1)
  @maxLength(50)
  @pattern("^[a-z0-9-]+$")
  slug: string;

  @maxLength(5000)
  description?: string;

  @minValue(15)
  @maxValue(60)
  duration: safeint;
}

model EventTypeUpdate {
  @minLength(1)
  @maxLength(200)
  title?: string;

  @maxLength(5000)
  description?: string;

  @minValue(15)
  @maxValue(60)
  duration?: safeint;
}

model AvailabilityUpdate {
  slots: AvailabilitySlot[];
}

model BookingCreate {
  /** Slot start time in UTC. */
  startTime: utcDateTime;

  /** Guest's full name. */
  @minLength(1)
  @maxLength(100)
  guestName: string;

  /** Guest's email address. */
  @format("email")
  guestEmail: string;
}

model SlotsResponse {
  eventType: EventType;
  timezone: string;
  slots: TimeSlot[];
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

@service(#{ title: "cal-work API" })
namespace CalWorkApi {
  // ── Event Types ──────────────────────────────────────────────

  @route("/api/event-types")
  namespace EventTypes {
    /** List all event types for the current user. */
    @get op list(): {
      @body body: EventType[];
    };

    /** Create a new event type. */
    @post op create(@body body: EventTypeCreate): {
      @statusCode _: 201;
      @body body: EventType;
    };

    /** Get a single event type by ID. */
    @get @route("{eventTypeId}") op read(
      @path eventTypeId: safeint,
    ): {
      @body body: EventType;
    };

    /** Update an existing event type. */
    @patch @route("{eventTypeId}") op update(
      @path eventTypeId: safeint,
      @body body: EventTypeUpdate,
    ): {
      @body body: EventType;
    };

    /** Delete an event type. */
    @delete @route("{eventTypeId}") op delete(
      @path eventTypeId: safeint,
    ): {
      @statusCode _: 204;
    };
  }

  // ── Availability ─────────────────────────────────────────────

  @route("/api/availability")
  namespace AvailabilityRoutes {
    /** Get the current user's weekly availability. */
    @get op read(): {
      @body body: Availability;
    };

    /** Create or replace the current user's availability. */
    @put op upsert(@body body: AvailabilityUpdate): {
      @body body: Availability;
    };
  }

  // ── Booking (public, no auth) ────────────────────────────────

  @route("/api/book")
  namespace Book {
    /** List free time slots for a given event type. */
    @get @route("{username}/{slug}/slots") op slots(
      @path username: string,
      @path slug: string,
      @query from: utcDateTime,
      @query to: utcDateTime,
    ): {
      @body body: SlotsResponse;
    };

    /** Create a booking for a free slot. */
    @post @route("{username}/{slug}") op create(
      @path username: string,
      @path slug: string,
      @body body: BookingCreate,
    ): {
      @statusCode _: 201;
      @body body: Booking;
    };
  }

  // ── Bookings (read-only) ─────────────────────────────────────

  @route("/api/bookings")
  namespace Bookings {
    /** List all bookings for the current user. */
    @get op list(): {
      @body body: Booking[];
    };

    /** Get booking details by ID. */
    @get @route("{bookingId}") op read(
      @path bookingId: safeint,
    ): {
      @body body: Booking;
    };
  }
}

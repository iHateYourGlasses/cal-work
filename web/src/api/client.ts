import type { paths } from "../types/api";

const BASE = "/api";

// Extract response types from generated paths
type SlotsResponse =
  paths["/api/book/{username}/{slug}/slots"]["get"]["responses"]["200"]["content"]["application/json"];
type BookingCreated =
  paths["/api/book/{username}/{slug}"]["post"]["responses"]["201"]["content"]["application/json"];
type BookingRead =
  paths["/api/bookings/{bookingId}"]["get"]["responses"]["200"]["content"]["application/json"];
type BookingsList =
  paths["/api/bookings"]["get"]["responses"]["200"]["content"]["application/json"];
type EventTypeList =
  paths["/api/event-types"]["get"]["responses"]["200"]["content"]["application/json"];
type EventTypeSingle =
  paths["/api/event-types/{eventTypeId}"]["get"]["responses"]["200"]["content"]["application/json"];
type AvailabilityData =
  paths["/api/availability"]["get"]["responses"]["200"]["content"]["application/json"];
type OverrideList =
  paths["/api/availability/overrides"]["get"]["responses"]["200"]["content"]["application/json"];
type OverrideCreated =
  paths["/api/availability/overrides"]["post"]["responses"]["201"]["content"]["application/json"];

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // ── Event Types ────────────────────────────────

  getEventTypes: () => request<EventTypeList>("/event-types"),

  getEventType: (id: number) => request<EventTypeSingle>(`/event-types/${id}`),

  createEventType: (body: {
    title: string;
    slug: string;
    description?: string;
    duration: number;
  }) =>
    request<EventTypeSingle>("/event-types", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateEventType: (
    id: number,
    body: { title?: string; description?: string; duration?: number },
  ) =>
    request<EventTypeSingle>(`/event-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteEventType: (id: number) =>
    request<void>(`/event-types/${id}`, { method: "DELETE" }),

  // ── Availability ───────────────────────────────

  getAvailability: () => request<AvailabilityData>("/availability"),

  updateAvailability: (body: {
    slots: { dayOfWeek: number; start: string; end: string }[];
  }) =>
    request<AvailabilityData>("/availability", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getOverrides: () => request<OverrideList>("/availability/overrides"),

  createOverride: (body: {
    date: string;
    type: string;
    start?: string;
    end?: string;
  }) =>
    request<OverrideCreated>("/availability/overrides", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteOverride: (id: number) =>
    request<void>(`/availability/overrides/${id}`, { method: "DELETE" }),

  // ── Booking ────────────────────────────────────

  fetchSlots: (username: string, slug: string, from: string, to: string) =>
    request<SlotsResponse>(
      `/book/${username}/${slug}/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),

  createBooking: (
    username: string,
    slug: string,
    body: { startTime: string; guestName: string; guestEmail: string },
  ) =>
    request<BookingCreated>(`/book/${username}/${slug}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Bookings ──────────────────────────────────────

  getBookings: () => request<BookingsList>("/bookings"),

  fetchBooking: (bookingId: number) =>
    request<BookingRead>(`/bookings/${bookingId}`),
};

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  username: text("username").primaryKey(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
});

export const eventTypes = sqliteTable(
  "event_types",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.username),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    duration: integer("duration").notNull(),
    minimumBookingNotice: integer("minimum_booking_notice").notNull().default(240),
  },
  (table) => [unique().on(table.userId, table.slug)],
);

export const availability = sqliteTable("availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .unique()
    .notNull()
    .references(() => users.username),
  slots: text("slots", { mode: "json" }).$type<AvailabilitySlotRow[]>().notNull().default([]),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventTypeId: integer("event_type_id")
    .notNull()
    .references(() => eventTypes.id),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: text("created_at").notNull(),
});

export interface AvailabilitySlotRow {
  dayOfWeek: number;
  start: string;
  end: string;
}

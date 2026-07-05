# cal-work MVP — remaining issues

> Tracer-bullet vertical slices from `docs/research/cal-com-vs-our-mvp.md`.
> Published after implementing P0 (edit/delete event types) + P1 (add-to-calendar).

---

## #1: Date overrides for availability (P1)

### What to build

Host can block specific dates or set custom hours on individual days, overriding the weekly schedule.

**Backend:**
- New table `date_overrides` (date, type: blocked|custom, optional start/end)
- CRUD endpoints: `GET/POST/DELETE /api/availability/overrides`
- Update `computeFreeSlots` to account for overrides: blocked date → 0 slots, custom hours → slots within those hours

**Frontend:**
- Date picker in `AvailabilityEditor` to select a date
- Option per date: block entire day, or set custom start/end hours
- List of existing overrides with delete

### Acceptance criteria

- [ ] TypeSpec models + endpoints defined for date overrides
- [ ] Host can block a specific date — zero slots appear on booking page
- [ ] Host can set custom hours for a specific date — only those hours produce slots
- [ ] Host can delete a date override — reverts to weekly schedule
- [ ] Overrides persist across server restarts

### Blocked by

None — can start immediately.

---

## #2: Bookings filtering (P2)

### What to build

On the Bookings page, add tabs or a segmented control to filter by status: Upcoming, Past, All.

**Backend:**
- Query parameter `status` on `GET /api/bookings` (values: `upcoming`, `past`, or absent for all)
- Filter in SQL query based on `endTime` vs current time

**Frontend:**
- `SegmentedControl` on `BookingsPage` with three options
- Re-fetch bookings when filter changes
- Show appropriate empty state per filter ("No upcoming bookings" vs "No past bookings")

### Acceptance criteria

- [ ] API accepts `?status=upcoming` and returns only future bookings
- [ ] API accepts `?status=past` and returns only past bookings
- [ ] Frontend filter toggles between Upcoming / Past / All
- [ ] Empty states differ per filter
- [ ] URL preserves filter state (optional, nice-to-have)

### Blocked by

None — can start immediately.

---

## #3: Display slots in host's local time (P2)

### What to build

Booking page currently shows slots as `"09:00 — 09:15 UTC"`. Change to display in the host's timezone (e.g. `"12:00 — 12:15 MSK"`), which is already returned by the slots API.

### Where

`BookingPage.tsx` only — replace `dayjs.utc(iso).format("HH:mm")` with `dayjs.utc(iso).tz(timezone).format("HH:mm")` and update the timezone label.

Also update `ConfirmedPage.tsx` time display to match.

### Acceptance criteria

- [ ] Slot times on booking page show in host timezone, not UTC
- [ ] Timezone abbreviation shown next to each slot (e.g. "MSK")
- [ ] Confirmed page times also show in host timezone
- [ ] No changes to API needed

### Blocked by

None — can start immediately.

---

## #4: Calendar date picker instead of date strip (P2)

### What to build

Replace the horizontal 7-day date button strip on the booking page with a full month calendar grid using `@mantine/dates` Calendar component. Days with available slots should be highlighted.

### Where

`BookingPage.tsx` — replace `ScrollArea` + `Group` of `Button` date elements with `Calendar` from `@mantine/dates`.

### Acceptance criteria

- [ ] Calendar grid shows current month with navigation to next/previous months
- [ ] Days with available slots are visually highlighted
- [ ] Clicking a day shows its time slots (same as current behavior)
- [ ] Days without slots are disabled
- [ ] Calendar respects the 7-day forward window (days beyond are disabled)

### Blocked by

None — can start immediately.

---

## #5: Multiple durations per event type (P3)

### What to build

Allow a single event type to offer multiple durations. Guest selects their preferred duration on the booking page before seeing slots.

**Backend:**
- Change `EventType.duration` from single `safeint` to array of ints (migration needed)
- Update slots endpoint to accept a `duration` query parameter
- Update create/update endpoints to accept array durations

**Frontend:**
- Edit/create form: multi-select or checkboxes for durations (15, 30, 45, 60)
- Booking page: if multiple durations, show duration selector before slots

### Acceptance criteria

- [ ] Event type can have multiple durations (e.g. [15, 30])
- [ ] Booking page shows duration picker when multiple durations exist
- [ ] Slots are computed for the selected duration
- [ ] Single-duration event types still work without picker
- [ ] Database migration handles existing single-duration data

### Blocked by

None — can start immediately.

---

## #6: Cancel / Reschedule booking (P3)

### What to build

Guest can cancel or reschedule their booking from the confirmation page. Host can cancel or reschedule from the bookings list.

**Backend:**
- `DELETE /api/bookings/{id}` — cancel booking
- `PATCH /api/bookings/{id}` — reschedule to new startTime
- Reschedule must validate new slot is free

**Frontend:**
- ConfirmedPage: "Cancel" and "Reschedule" buttons
- Cancel → confirmation dialog → redirect to booking page
- Reschedule → back to slot selection with pre-filled guest info
- BookingsPage: cancel/reschedule actions on each row

### Acceptance criteria

- [ ] Guest can cancel booking from confirmation page
- [ ] Guest can reschedule booking (pick new slot) from confirmation page
- [ ] Host can cancel booking from bookings list
- [ ] Host can reschedule booking from bookings list
- [ ] Reschedule validates no double-booking
- [ ] Cancelled bookings don't appear as upcoming

### Blocked by

None — can start immediately.

---

## #7: Event buffers (P3)

### What to build

Add configurable buffer time before and after each meeting. A 5-minute buffer after a 30-minute meeting means the host's next available slot starts 35 minutes later. Buffers stack — a buffer-before of 10min and a meeting of 30min means the slot after needs a 40min gap from the previous meeting's start.

**Backend:**
- Add `bufferBefore` and `bufferAfter` fields to `EventType` model and DB
- Update `computeFreeSlots` to add buffer time to each booking's occupied window

**Frontend:**
- EventTypeEditPage: number inputs for buffer minutes (0–60)

### Acceptance criteria

- [ ] Host can set buffer-before and buffer-after in event type settings
- [ ] Buffer-before removes slots that start too close to a previous booking's end
- [ ] Buffer-after removes slots that end too close to a next booking's start
- [ ] Zero buffer (default) works as before
- [ ] Buffers visible in event type edit form with clear labels

### Blocked by

None — can start immediately.

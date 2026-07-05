# cal.com vs cal-work MVP -- Feature Comparison

> Research date: July 2026
> Sources: cal.com homepage, help docs (help/llms.txt), API docs, plus local source inspection of cal-work MVP.

---

## 1. Event Type Management

### 1.1 Create Event Type

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Title | Text input, "30 Minute Consultation" | Text input, placeholder "30 Minute Consultation" | Identical |
| URL/Slug | Configurable, auto-suggested, e.g. `cal.com/bailey/example-event` | Configurable, auto-generated from title via `slugify()`, editable manually | Identical |
| Description | Textarea, optional | Textarea, optional (`autosize`, minRows=3) | Identical |
| Duration | Numeric input, any value | Dropdown: 15, 30, 45, 60 min | cal-work more constrained |
| Multiple durations | cal.com supports multiple available durations per event type (e.g. 15m, 30m, 45m, 1h) | Single duration only | Gap |
| Location | Many options: In-person (address), Custom Link, Attendee phone, Organizer phone, Cal Video, third-party (Zoom, Google Meet, Teams, etc.), plus ability to have multiple locations per event type and toggle visibility before/after booking | N/A (no location concept in MVP) | Gap |
| Secret event types | Private links; unlisted, not on public profile | N/A | Gap |
| Recurring events | Supported | N/A (out of MVP scope per `plans/mvp-architecture.md`) | Gap |
| Phone-only events | Supported (phone-based booking instead of email) | N/A | Gap |
| Custom event name in booking | Host can customize how the event name appears on the booker's calendar | Uses event type title directly | Gap |
| Booking success redirect | Custom redirect URL after successful booking | Redirects to `/book/:username/:slug/confirmed/:bookingId` | Different approach |
| Requires confirmation | Host can require manual confirmation before a booking is finalized | N/A (bookings auto-confirmed) | Gap |
| Payments (Stripe) | Supported | N/A (out of scope) | Gap |

### 1.2 Event Type List / Dashboard

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| List all event types | Grid/list of event type cards | Card-based list with title, duration badge, slug, copy-link button | Similar |
| Copy booking link | Via share/copy button | `IconCopy` action icon -> copies `{origin}/book/alex/{slug}` to clipboard | Comparable |
| Create new | "+ New" button, opens full form | "Create" button -> navigates to `/dashboard/event-types/new` | Comparable |
| Edit existing | Click card -> edit page with ALL settings (duration, location, availability schedule assignment, buffers, booking questions, etc.) | No edit button; cards are view-only (only "Copy link" action) | **Major gap** |
| Delete | Delete button per event type | No delete button in dashboard UI (API endpoint exists but no frontend wiring) | **Gap** |
| Duplicate | Supported | N/A | Gap |
| Event type ID visible | Event type ID shown for developers | Not exposed | Gap |

### 1.3 Advanced Event Type Settings

These are **cal.com features not present in cal-work MVP** (note: many are out of MVP scope per the architecture plan):

| Feature | cal.com Description |
|---|---|
| Event buffers | Configurable buffer time before/after meetings (per event type). Buffers stack between meetings. Detailed docs with 5 scenario examples. |
| Custom time-slot intervals | Choose slot interval granularity (e.g., 15min, 30min, 60min). Default: use event length. Smaller interval = more slots. |
| Minimum notice | Minutes/hours/days before booking is allowed (e.g., no same-day bookings). Our backend implements a 4-hour (240 min) default cutoff. |
| Booking frequency limits | Per-day, per-week, per-month, per-year caps to avoid meeting overload. Also "Allow rescheduling past events", "Booker Active Booking Limit". |
| Booking questions | Fully customizable: add any number of text/number/dropdown/checkbox/phone questions. `Identifier` system for programmatic access. Can require/exclude email domains. |
| Calendar-specific conflict checking | Per-event-type control over which calendars are checked for conflicts. |
| Hide organizer email | Hide organizer's email in calendar event descriptions. |
| Hide notes in calendar | Control whether internal notes are sent to the calendar event. |
| Disable guests | Prevent attendees from adding extra guests. |
| Disable cancel/reschedule | Lock bookings so attendees cannot modify them. |
| Disable confirmation email | Suppress attendee confirmation emails. |
| Allow rescheduling past events | Let bookers reschedule events that have already passed. |
| Lock timezone on booking page | Force a fixed timezone on the booking page so all visitors see slots in one tz. |

---

## 2. Availability

### 2.1 Weekly Schedule

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Days of week | Mon-Sun, checkbox to enable each day | Mon-Sun, checkbox to enable each day | Identical |
| Time ranges per day | Start/end time selectors. Multiple time windows per day supported ("Multiple slots"). | Start/end 30-min increment Select dropdowns. Single window per day only. | cal-work more limited |
| Named schedules | Each availability schedule has a name (e.g. "Work Hours", "Weekend") | Single unnamed availability | Gap |
| Multiple schedules | No limit on number of schedules. Can be assigned per event type. | Exactly one availability per user (single row in DB) | Gap |
| Timezone per schedule | Each schedule has its own IANA timezone setting | Hardcoded to `"Europe/Moscow"` (display text in the card) | Gap |
| Duplicate schedule | Supported | N/A | Gap |

### 2.2 Advanced Availability

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Date overrides | Block specific dates or set custom hours on a particular date. Also "Holidays" feature auto-blocks public holidays by country. | N/A | Gap |
| Out of office | Block bookings for a period, optionally redirect to teammate. Manage for self or team. | N/A | Gap |
| Team availability | View team members' schedules side-by-side | N/A | Gap |

### 2.3 Availability UI

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Edit page | Dedicated settings page per schedule with save button in upper-right | Inline editor on Dashboard page + standalone `/dashboard/availability` page with `AvailabilityEditor` component + "Save Availability" button | Comparable but simpler |
| Save feedback | Visual save confirmation | Mantine notification: "Saved" / "Availability updated" (green) | Comparable |
| Drag/visual editing | Schedule shown as visual blocks (screenshots show a timeline view) | Checkbox + two dropdown Selects per day | cal-work is more form-like |

---

## 3. Booking Flow (Guest Experience)

### 3.1 Booking Page URL & Header

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| URL pattern | `cal.com/{username}/{slug}` | `/book/{username}/{slug}` | Same pattern |
| Header | Host name, photo, event title, duration badge(s), timezone | Event title (h3), duration badge, timezone text | Comparable but cal.com includes photo |
| Branding | Custom brand colors, logo | "cal-work" brand in top-left header (hidden on booking pages) | cal.com more polished |

### 3.2 Slot Selection

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Date picker | Likely a calendar grid view (month) | Horizontal scroll of 7-day date buttons (`ScrollArea` + `Group` with `Button` components). | cal-work uses date strip instead of calendar |
| Available dates visible | Dates with slots are highlighted | All dates with slots shown (7-day forward window) | Similar, but cal-work limited to 7 days |
| Slot display | Time slots as clickable buttons; possibly grouped by morning/afternoon/evening as in our original plan | Cards (`Card` with `withBorder`, `cursor: pointer`) showing `"HH:mm -- HH:mm UTC"` | cal-work shows UTC explicitly; cal.com shows in host's local time |
| Timezone display | Shows host's timezone; option to lock timezone so guest cannot change | Shows timezone name (e.g. "Europe/Moscow") | Comparable |
| No available slots | Appropriate empty state | `"No available slots for the next 7 days."` message | Good |
| Calendar overlay | Bookers can overlay their own Google/Outlook calendar to find mutually free times | N/A | Gap |
| Pre-fill fields via URL | Query params forwarded to booking form | N/A | Gap |
| Embed support | Embeddable booking widget (`cal.com/embed`) | N/A (out of scope) | Gap |

### 3.3 Booking Form (Step 2)

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Selected slot display | Shows date and time prominently | Blue-tinted `Card` with `"dddd, MMMM D -- HH:mm - HH:mm (timezone)"` | Comparable |
| Name field | Full name (or split first/last depending on config) | Single `TextInput` "Your name" | Comparable |
| Email field | Email input | `TextInput` type="email" "Your email" | Comparable |
| Custom questions | Any number of custom fields (text, number, dropdown, checkbox, phone) | N/A | Gap |
| "Change time" / Back | Back button to return to slot selection | `<Button variant="subtle"> <- Change time` | Comparable |
| Submit button | "Confirm" or "Book" | `"Confirm Booking"` full-width button | Comparable |
| Guest field | Option to add additional guests | N/A | Gap |
| Timezone dropdown for guest | Guest can change their viewing timezone (unless locked) | N/A | Gap |

### 3.4 Booking Page Layout

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Minimal/no sidebar | Full-width booking page | Sidebar hidden on `/book/*` routes (`isBookingPage` check), `padding={0}` | Same intent |
| Mobile responsive | Yes | Yes (Mantine AppShell responsive breakpoints) | Comparable |
| Loading state | Skeleton/spinner | `<Center py="xl"><Loader /></Center>` | Good |
| Error state (event not found) | 404 page | `"Event type not found."` centered text | Good |

---

## 4. Bookings Dashboard & Confirmation

### 4.1 Bookings List View

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Table columns | Event type, guest, date/time, status, and more | Event Type, Guest, Email, Date/Time, Status (5 columns) | Similar core columns |
| Status badges | Upcoming, Past, Cancelled, No-show | Past (gray) / Upcoming (green) badges | cal-work simpler (no cancelled/no-show) |
| Filtering | Filter by status (upcoming, past, cancelled), date range filter (default 7 days for past bookings). Also has search. | No filtering or search | **Gap** |
| Pagination | Cursor-based pagination in API | No pagination (all bookings returned) | Gap |
| Empty state | Message encouraging sharing booking link | Centered `IconCalendarOff` icon + `"No bookings yet. Share your booking link to get started."` | Good, possibly better than cal.com |
| Insights/Analytics | Separate **Insights dashboard** with: average booking duration, booking event trends, booking KPI stats, booking member stats, failed bookings by routing field, routed-to users per period | N/A | Gap |
| Booking actions | Reschedule, Cancel, Mark no-show, Block attendee, View details | View-only (no actions) | **Gap** |
| Reschedule UI | Host can reschedule with busy slot indicators (color-coded: free vs busy) | N/A | Gap |
| Audit logs | Enterprise: detailed history of booking changes | N/A | Gap |

### 4.2 Confirmation Page (Guest View)

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Success icon | Checkmark or similar | `ThemeIcon` green circle + `IconCircleCheck` (64px, radius "xl") | Comparable |
| Title | "You're booked!" or "Confirmed" | `"You're booked!"` (h2) | Identical messaging |
| Event details | Event title, date, time, timezone | Event title (h5), "When:" date, "Time:" range, "Name:", "Email:" | Comparable |
| Add to Calendar links | Google, Microsoft Office, Microsoft Outlook, downloadable ICS file | N/A (MVP disclaimer joke instead: "A confirmation has been sent to your email (not really - MVP, remember?).") | **Major gap** (but intentional for MVP) |
| Reschedule/Cancel | Option for guest to reschedule or cancel | N/A | Gap |
| Meeting location | Location/link shown (e.g., Google Meet, Zoom, address) | N/A | Gap |
| Booking ID | Visible | Available in URL params (`bookingId`), not explicitly displayed | Minor gap |

---

## 5. Layout / UX

### 5.1 Sidebar Navigation

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Nav items | Event Types, Availability, Bookings, Insights, Apps, Settings (and more for teams/orgs) | Event Types (`IconCalendarEvent`), Availability (`IconClock`), Bookings (`IconCalendarTime`) | cal-work is a subset |
| Active state | Highlighted current page | `NavLink` `active` prop with `variant="light"` and `borderRadius: 8` | Comparable |
| Icons | Icons per nav item | Tabler icons per nav item | Comparable |
| Collapsible | App sidebar can be collapsed | Fixed 240px width with `breakpoint: "sm"` | Comparable |
| Hidden on booking pages | N/A (booking pages are on subdomain or same app?) | Sidebar hidden on `/book/*` routes (`navbar={undefined}`) | cal-work approach is intentional |

### 5.2 Header

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Logo | cal.com logo/wordmark | "cal-work" text (blue, bold), clickable -> `/dashboard` | Comparable |
| User info | Avatar + name | "alex" text (dimmed, small) | cal-work simpler (no avatar) |
| Height | ~56px | 56px (explicitly set) | Same |

### 5.3 Error Handling & Feedback

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Notifications | Toast notifications | Mantine `@mantine/notifications` -- used for copy-link, save, errors | Comparable |
| API errors | User-friendly messages | `String(err)` from `request()` (`HTTP {status}: {body}`) -- raw but functional | cal-work simpler |
| Form validation | Client-side + server | Client-side: `required` on inputs + manual check before submit. Server: validated via `express-openapi-validator` | Comparable |
| Slug conflict | Inline error message | Notification via `notifications.show()` with `String(err)` | cal-work less polished |

### 5.4 Empty States

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| No event types | Prompt to create first | Card with `"No event types yet. Create your first one!"` + Create button | Good |
| No bookings | Prompt to share link | `IconCalendarOff` icon + message | Good |
| No availability | No slots shown | Mantine `Select` data includes ALL 48 half-hour options as both label and value | Functional |
| Loading states | Skeleton/spinner | `"Loading..."` text or `<Loader />` centered | Acceptable for MVP |

### 5.5 Styling / Theming

| Feature | cal.com | cal-work MVP | Match? |
|---|---|---|---|
| Light/Dark mode | Light, Dark, System-default toggle | `defaultColorScheme="light"` (hardcoded) | cal-work light-only |
| Brand colors | Customizable via settings | Default Mantine blue colors | cal-work not configurable |
| Custom booking page theme | Separate theme for public booking page | Booking page uses same Mantine theme | No separation |

---

## 6. Features cal.com Has That We Are Missing (Beyond MVP Scope)

These are cal.com features that fall outside the stated MVP scope in `plans/mvp-architecture.md`, but are worth listing for completeness:

### 6.1 Authentication & Multi-User
- Email, Google, SSO, SAML login
- Multiple users per instance
- Teams and Organizations with role-based access (admin, member, custom roles)
- OAuth client management for API access
- Multiple OAuth scopes (PROFILE_READ, EVENT_TYPE_WRITE, BOOKING_READ, etc.)
- Session management, account lockout protection

### 6.2 Calendar Integration
- Google Calendar sync (two-way: read busy times, write new events)
- Outlook / Microsoft 365 sync
- Apple Calendar (iCloud)
- ICS feed subscription
- Cross-referencing busy times from ALL connected calendars
- Per-event-type conflict checking (which calendars to check)
- Destination calendar selection (which calendar new events go to)
- Delegation credentials (admin-managed Google Workspace / Microsoft 365 for org-wide calendar connection)

### 6.3 Video Conferencing
- Cal Video (built-in, included free)
- Zoom integration
- Google Meet integration
- Microsoft Teams integration
- Multiple conference apps switchable per event
- Team-wide conferencing defaults

### 6.4 Notifications & Workflows
- Email confirmations and reminders (customizable per event type)
- SMS reminders and notifications
- Automated workflow triggers (booking created, rescheduled, cancelled, meeting reminder, etc.)
- Custom SMTP for organizations (send from own domain)
- Guest notification settings (control which emails attendees receive)

### 6.5 Payments
- Stripe integration for paid bookings
- Per-event-type pricing
- Seat billing for teams/orgs

### 6.6 Team & Organization Features
- Round-robin scheduling (distribute bookings across team members)
- Collective events (multiple team members in one meeting)
- Managed events (admin-defined shared event types for team)
- Attribute-based routing (route bookings by attendee attributes)
- Routing forms (qualify leads before booking)
- Organization-wide booking blocklist and reporting
- Audit logs (enterprise)

### 6.7 Developer & Platform
- Webhooks (event type and org-level)
- Public API v2 (RESTful, OAuth/API key auth)
- AI agent support (Cal.ai) - AI phone agent
- MCP server (connect AI assistants like Claude, Cursor)
- Embeddable booking widget (`cal.com/embed`)
- Open source (self-hosted via Docker)
- Mobile apps (iOS, Android)
- Desktop apps (Mac, Windows, Linux)

### 6.8 Advanced Booking Features
- Recurring bookings
- Seated events (multiple attendees for a single slot)
- Instant meetings
- Dynamic group links (book with any available team member)
- Routing forms (qualification before booking)
- Pre-fill fields via URL params and embeds
- Booking page analytics
- UTM parameter tracking

### 6.9 UX Polish
- Customizable booking page brand colors (light + dark themes)
- 65+ languages (i18n)
- Profile photo on booking page
- Calendar heatmap / visual availability display
- Onboarding wizard (name -> timezone -> calendar connect -> availability -> profile)
- Short booking links (`cal.com/username`)
- Booking page analytics

---

## 7. Features We Have That cal.com Does Not

This is a short list, as cal.com is a much more mature product:

### 7.1 Database Approach
| Our approach | cal.com approach |
|---|---|
| SQLite (WAL mode) -- zero infrastructure, single file | PostgreSQL (production) |
| Drizzle ORM with raw SQL for table creation | Prisma ORM |

This is an architectural choice, not a feature, but it means cal-work can run entirely locally with no external database dependency.

### 7.2 API Spec / TypeSpec
| Our approach | cal.com approach |
|---|---|
| TypeSpec (`main.tsp`) as single source of truth for API contract | OpenAPI directly (or generated from code annotations) |

TypeSpec provides a more expressive, type-safe API design language compared to writing raw OpenAPI YAML.

### 7.3 Schema-First Runtime Validation
| Our approach | cal.com approach |
|---|---|
| `express-openapi-validator` validates ALL requests and responses at runtime against the OpenAPI spec -- automatic 400/500 on violations | Custom validation logic in route handlers / middleware |

This provides an additional safety net: if the implementation drifts from the spec, the validator catches it at runtime.

### 7.4 Dev Workflow with Prism Mocks
| Our approach | cal.com approach |
|---|---|
| Three-terminal setup: TypeSpec watch + Prism mock server (:4010) + Vite dev (:5173). Frontend built entirely against realistic mocks first, real backend second. | Real backend required from day one (or separate mock setup). |

This "API-first, mock-driven development" approach allows the frontend to be fully developed and tested before the backend is complete.

### 7.5 MVP-Specific Simplicity
| Our approach | cal.com approach |
|---|---|
| No sign-up, no auth, one hardcoded user. Instant onboarding. | Full auth flow required. |

For demos, testing, or single-user scenarios, cal-work has zero-friction setup.

### 7.6 Completely Static Slot Computation
| Our approach | cal.com approach |
|---|---|
| Pure function `computeFreeSlots()` -- independently testable, no database in unit tests, SQLite `:memory:` for integration tests | Real database queries |

The pure-function approach makes the core scheduling algorithm easy to verify and test in isolation.

### 7.7 Mantine UI Component Library
| Our approach | cal.com approach |
|---|---|
| Mantine (v9.4.1) for consistent, accessible UI components (AppShell, NavLink, Card, Table, notifications, etc.) | Custom UI library / Tailwind-based components |

Mantine provides a rich set of battle-tested React components with built-in accessibility, theming, and responsive behavior.

---

## 8. Summary: MVP Completeness vs cal.com

### 8.1 Per-Area Coverage

| Area | cal-work MVP Coverage | Gap Severity |
|---|---|---|
| Event Type Create | 90% -- all basic fields present; missing edit/delete UI | Medium -- edit/delete are table-stakes for usability |
| Event Type Advanced Settings | 5% -- only duration; no buffers, booking questions, location, min notice, etc. | Low priority for MVP (explicitly out of scope) |
| Availability | 60% -- weekly schedule works; missing date overrides, multiple schedules, per-event-type assignment | Medium -- date overrides are very useful |
| Booking Flow (Guest) | 80% -- slot selection + form + confirmation all work end-to-end; missing calendar overlay, add-to-calendar links | Medium -- add-to-calendar is a key integration |
| Bookings Dashboard | 40% -- list view and status badges work; missing filtering, search, pagination, reschedule/cancel | Medium -- filtering/pagination needed at scale |
| Confirmation Page | 50% -- core info displayed; missing add-to-calendar, reschedule/cancel, meeting location | Medium -- add-to-calendar is expected |
| Layout / UX | 75% -- sidebar, header, empty states, loading states all present; no dark mode, no i18n | Low priority for MVP |
| Auth / Multi-user | 0% | Explicitly out of scope |
| Calendar Sync | 0% | Explicitly out of scope |
| Notifications | 0% | Explicitly out of scope |

### 8.2 Key Takeaways

1. **The core booking pipeline works end-to-end.** A host can create an event type, a guest can visit the link, view available slots, pick one, fill their name/email, and receive a confirmation. This is the fundamental cal.com value proposition.

2. **The biggest near-term gaps (within MVP scope):**
   - **Edit/Delete event types** -- The UI has no way to modify or remove existing event types, despite the API supporting PATCH and DELETE. This is the single most impactful missing piece for the dashboard.
   - **Date overrides for availability** -- cal.com's date override system is a heavily-used feature. Without it, hosts cannot handle one-off schedule changes (holidays, sick days, meetings).
   - **Add-to-Calendar links on confirmation** -- This is table-stakes for a scheduling tool. Without ICS/Google/Outlook links, bookings may be missed.
   - **Bookings filtering and actions** -- The list view is functional but lacks reschedule, cancel, filtering, or search. Even for an MVP, at least filtering by upcoming/past would be valuable.

3. **What cal-work does differently (and sometimes better):**
   - **Schema-first API design** with TypeSpec + runtime validation is more rigorous than cal.com's approach.
   - **Prism mock-driven development** decouples frontend from backend, enabling parallel development.
   - **Pure function slot algorithm** is independently testable and auditable.
   - **SQLite + single-file DB** means zero-infrastructure deployments for single-user scenarios.
   - **Mantine UI library** provides a consistent, accessible component foundation.

4. **The cal.com booking flow is more polished in these specific UX details:**
   - Calendar date picker (month grid) rather than a horizontal date strip
   - Time slots displayed in the host's local time, not UTC
   - Host profile photo on the booking page
   - Multiple duration options visible to the booker
   - Location/map/meeting link on the confirmation page
   - Brand-color-themed booking page

5. **MVP scope decisions were correct.** The features explicitly excluded from MVP (auth, calendar sync, payments, email, teams) are genuinely non-trivial. Each would add significant complexity. Starting with a focused, working scheduling pipeline was the right call.

### 8.3 Recommended Priority Order for Addressing Gaps

Assuming the goal is to close the gap with cal.com's core individual-user experience:

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| **P0** | Edit event type page | Medium | Very High |
| **P0** | Delete event type from dashboard | Small | High |
| **P1** | Add-to-Calendar links (ICS, Google, Outlook) | Medium | Very High |
| **P1** | Date overrides for availability | Large | High |
| **P2** | Bookings filtering (upcoming/past) | Small | High |
| **P2** | Display slots in host's local time (not UTC) | Small | High |
| **P2** | Calendar date picker (month grid) instead of date strip | Medium | Medium |
| **P3** | Multiple durations per event type | Medium | Medium |
| **P3** | Cancel/Reschedule booking | Medium | Medium |
| **P3** | Event buffers (before/after) | Medium | Medium |
| **P4** | Dark mode | Small | Low |
| **P4** | Multiple availability schedules | Large | Medium |
| **P4** | Booking questions (custom fields) | Large | Medium |
| **P5** | Payment integration | Very Large | Low (for MVP) |
| **P5** | Calendar sync | Very Large | Low (for MVP) |
| **P5** | Auth / Multi-user | Very Large | Low (for MVP) |

---

## 9. Detailed Booking Flow Comparison (Side-by-Side Walkthrough)

This section walks through the exact same scenario on both platforms to highlight detailed UX differences.

### Scenario: A host named Alex creates a "30 Minute Consultation" event type and a guest named Ivan books it.

#### Step 1: Host Creates Event Type

**cal.com:**
1. Clicks "New event type" button in top-right of Event Types page
2. A dialog/modal appears with fields: Title, URL (auto-suggested), Description, Length
3. After creation, taken to a full edit page with tabs/sections: Event Setup (duration, location), Availability (assign schedule), Limits (booking frequency, buffers, notice), Booking Questions, Workflows, Apps
4. Custom URL: `cal.com/alex/30min`

**cal-work MVP:**
1. Clicks "Create" button -> navigates to `/dashboard/event-types/new`
2. A full-page form appears with: Title, Slug (auto-generated, editable), Duration (dropdown), Description (textarea)
3. After creation, redirected to `/dashboard` -- no edit page exists
4. Custom URL: `/book/alex/30min`

**Diff:** cal-work creates the event type successfully but provides no post-creation configuration. cal.com's edit page exposes 6+ categories of settings.

#### Step 2: Host Sets Availability

**cal.com:**
1. Navigates to Availability dashboard
2. Creates a named schedule (e.g., "Work Hours")
3. Sets timezone for the schedule
4. Checks Mon-Fri, sets 9:00 AM - 5:00 PM for each
5. Can add date overrides: block July 10th for a holiday, set custom hours for July 12th
6. Can create multiple schedules and assign them to different event types

**cal-work MVP:**
1. Navigates to Availability page (or uses inline editor on Dashboard)
2. Checks Mon-Fri checkboxes, selects 09:00 as start and 17:00 as end from dropdowns
3. Clicks "Save Availability"
4. Timezone is hardcoded to "Europe/Moscow" (stated in the card description)
5. Single schedule, no date overrides

**Diff:** cal-work's availability editor works for simple cases but lacks date overrides (crucial for real-world use) and multi-schedule support. The 30-minute increment dropdowns work but are less flexible than free-form time inputs.

#### Step 3: Guest Visits Booking Link

**cal.com:**
1. Opens `cal.com/alex/30min`
2. Sees: Alex's photo, name, "30 Minute Consultation" title, 30min badge, timezone
3. Calendar grid showing the current month with available dates highlighted
4. Clicking a date shows time slots as a list of buttons (e.g., 9:00 AM, 9:30 AM, 10:00 AM) in the host's local time
5. Guest can change timezone via a dropdown (seeing slots in their own time)
6. Option to overlay their own calendar for mutual availability

**cal-work MVP:**
1. Opens `/book/alex/30min`
2. Sees: "30 Minute Consultation" title (h3), 30min badge, "Europe/Moscow" timezone text
3. Horizontal scroll of 7 date buttons (e.g., "Sun, Jul 5", "Mon, Jul 6")
4. Clicking a date shows time slots as bordered cards: "06:00 -- 06:30 UTC", "06:30 -- 07:00 UTC"
5. All times shown in UTC (plus timezone label in header)
6. No calendar overlay, no guest timezone dropdown

**Diff:** cal-work's UX is functional but rougher. Displaying slots in UTC is confusing for end users -- cal.com's approach of showing local time with timezone label is much more intuitive. The 7-day date strip is less discoverable than a full calendar grid.

#### Step 4: Guest Selects Slot & Fills Form

**cal.com:**
1. Clicks a time slot
2. Moves to a form view (or inline expansion) showing the selected time prominently
3. Form fields: Name (may be split into First/Last), Email, plus any custom booking questions the host defined
4. "Confirm" button
5. "Change time" back link

**cal-work MVP:**
1. Clicks a slot card
2. The same container switches to form view:
   - Blue-tinted card: "Monday, July 6 -- 06:00 - 06:30 (Europe/Moscow)"
   - "<- Change time" subtle button
   - "Your name" text input
   - "Your email" text input
   - "Confirm Booking" full-width button

**Diff:** Nearly identical for the basic fields. cal-work's "Change time" button and selected-slot display card are well-implemented.

#### Step 5: Confirmation

**cal.com:**
1. "You're booked!" confirmation page
2. Event title, date/time, timezone
3. Location/meeting link (if configured)
4. "Add to Calendar" buttons: Google Calendar, Microsoft Office 365, Microsoft Outlook, downloadable .ICS file
5. Option to reschedule or cancel

**cal-work MVP:**
1. "You're booked!" confirmation page (green checkmark icon)
2. Event title
3. "When: Monday, July 6, 2026"
4. "Time: 06:00 -- 06:30 UTC"
5. "Name: Ivan Petrov"
6. "Email: ivan@example.com"
7. "A confirmation has been sent to your email (not really -- MVP, remember?)" -- humorous disclaimer

**Diff:** cal-work's confirmation page has a charming MVP personality but critically lacks "Add to Calendar" links. The UTC time display is also confusing. The humorous disclaimer is fine for MVP but should eventually be replaced with real calendar integration.

---

## 10. API Surface Comparison

### cal-work API (from `main.tsp`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/event-types` | GET | List event types for user |
| `/api/event-types` | POST | Create event type |
| `/api/event-types/{eventTypeId}` | GET | Get single event type |
| `/api/event-types/{eventTypeId}` | PATCH | Update event type |
| `/api/event-types/{eventTypeId}` | DELETE | Delete event type |
| `/api/availability` | GET | Get user's availability |
| `/api/availability` | PUT | Create/replace availability |
| `/api/book/{username}/{slug}/slots` | GET | List free slots |
| `/api/book/{username}/{slug}` | POST | Create booking |
| `/api/bookings` | GET | List all bookings for user |
| `/api/bookings/{bookingId}` | GET | Get booking by ID |

**Total: 12 endpoints**

### cal.com API v2 (subset relevant to individual scheduling)

cal.com's API v2 has 100+ endpoints covering: event types (CRUD), schedules (CRUD), bookings (CRUD + cancel, reschedule, confirm, decline, mark no-show, reassign, block, add guests, add attendees), calendars (connect, disconnect, list, busy times, check), conferencing (connect, disconnect, list, set default), destination calendars, booking questions, event type private links, webhooks, OAuth, organizations, teams, memberships, attributes, routing forms, insights (6+ analytics endpoints), workflows, and more.

**Total: 100+ endpoints**

### Key API Design Differences

| Aspect | cal-work | cal.com |
|---|---|---|
| Spec format | TypeSpec -> OpenAPI 3 | OpenAPI 3 directly |
| Runtime validation | `express-openapi-validator` (req + res) | Custom validation |
| Auth | None (hardcoded user) | OAuth 2.0, API keys, Platform credentials |
| Pagination | None | Cursor-based |
| Rate limiting | None | 120 req/min (API keys) |
| API versioning | None | v2 (via header: `cal-api-version`) |
| Scopes | N/A | Granular OAuth scopes (PROFILE_READ, EVENT_TYPE_WRITE, BOOKING_READ, etc.) |
| Webhooks | N/A | Event-type and org-level webhooks |
| Idempotency | N/A | Via `externalRef` on credit charging |

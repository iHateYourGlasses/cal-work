# Cal.com Architecture Research

> **Date:** 2026-07-05  
> **Primary source:** [github.com/calcom/cal.diy](https://github.com/calcom/cal.diy) (community fork of cal.com, all enterprise code removed, 100% MIT)  
> **Secondary sources:** [cal.com/docs](https://cal.com/docs), API reference, `packages/prisma/schema.prisma`, `packages/lib/availability.ts`  
> **Note:** The main cal.com repo on GitHub now redirects to `calcom/cal.diy`, a community-maintained fork that strips enterprise/commercial code. The schema, core logic, and API design remain the same as upstream cal.com.

---

## 1. Tech Stack

| Layer | Choice | Source |
|-------|--------|--------|
| Frontend framework | **Next.js** (SSR + SPA) | `apps/web/` in monorepo |
| Backend API layer | **tRPC** (end-to-end typesafe RPC) | README "Built With" section |
| UI | **React.js** + **Tailwind CSS** | README |
| Database | **PostgreSQL** (>=13.x) | `packages/prisma/schema.prisma`: `datasource db { provider = "postgresql" }` |
| ORM | **Prisma** (with zod-prisma-types, prisma-kysely, prisma-enum-generator) | `packages/prisma/schema.prisma` generator blocks |
| Video | **Daily.co** | README |
| Auth | **NextAuth.js** (Session-based with JWT) | User model relations: `sessions Session[]`, `accounts Account[]` |
| Real-time | **WebSockets** (via tRPC subscriptions, Socket.io) | `socket.io-parser` in package.json resolutions |
| Email | **SendGrid** + React Email templates | `packages/lib/Sendgrid.ts`, `packages/emails/` |
| Calendar sync | OAuth2 with Google Calendar API, Microsoft Graph API | README integrations section |
| Monorepo | **Turborepo** + **Yarn 4** workspaces | `turbo.json`, `package.json` workspaces |
| Testing | Playwright (E2E) + Vitest (unit) | `playwright.config.ts`, `vitest.config.mts` |
| Linting/Formatting | Biome | `biome.json` |
| Container | Docker | `Dockerfile`, `docker-compose.yml` |

---

## 2. Database Schema

**Source:** `packages/prisma/schema.prisma` in the cal.diy repo (16,000+ lines)

### 2.1 Core Tables

#### **User**
- `id` (Int, PK, autoincrement)
- `uuid` (UUID, unique)
- `username` (String?, unique per organization)
- `name` (String?)
- `email` (String, unique)
- `timeZone` (String, default "Europe/London")
- `weekStart` (String, default "Sunday")
- `bufferTime` (Int, default 0) — global buffer time in minutes
- `hideBranding` (Boolean)
- `theme`, `appTheme` (String?)
- `createdDate` (DateTime, mapped to "created")
- `trialEndsAt` (DateTime?)
- `completedOnboarding` (Boolean, default false)
- `locale` (String?)
- `timeFormat` (Int?, default 12)
- `twoFactorEnabled` (Boolean, default false)
- `identityProvider` (enum IdentityProvider: CAL, GOOGLE, SAML, AZUREAD)
- `identityProviderId` (String?)
- `allowDynamicBooking` (Boolean?, default true)
- `allowSEOIndexing` (Boolean?, default true)
- `metadata` (Json?)
- `role` (enum UserPermissionRole: USER, ADMIN)
- `locked` (Boolean, default false)
- `isPlatformManaged` (Boolean, default false)
- Relations: `password UserPassword?`, `eventTypes EventType[]`, `credentials Credential[]`, `teams Membership[]`, `bookings Booking[]`, `schedules Schedule[]`, `destinationCalendar DestinationCalendar?`, `profiles Profile[]`, `accounts Account[]`, `sessions Session[]`, `apiKeys ApiKey[]`

#### **UserPassword** (separate model for security)
- `hash` (String)
- `userId` (Int, unique, FK → User)
- Avoids leaking password hash through GraphQL/API responses.

#### **Profile** (Organization-scoped user identity)
- `id` (Int, PK, autoincrement)
- `uid` (String)
- `userId` (Int, FK → User)
- `organizationId` (Int, FK → Team)
- `username` (String)
- `eventTypes EventType[]`
- Unique on `[userId, organizationId]` and `[username, organizationId]`

#### **Team** (serves dual role: Teams AND Organizations)
- `id` (Int, PK, autoincrement)
- `name` (String)
- `slug` (String?, unique per parent)
- `isOrganization` (Boolean, default false) — distinguishes orgs from teams
- `parentId` (Int?, self-referential FK) — teams belong to organizations
- `isPlatform` (Boolean, default false)
- `timeZone` (String, default "Europe/London")
- `weekStart` (String, default "Sunday")
- `metadata` (Json?)
- `hideBranding`, `isPrivate`, `hideBookATeamMember` (Boolean)
- Relations: `members Membership[]`, `eventTypes EventType[]`, `children Team[]`, `orgUsers User[]`, `orgProfiles Profile[]`

#### **Membership** (User ↔ Team/Org junction)
- `id` (Int, PK, autoincrement)
- `teamId` (Int, FK → Team)
- `userId` (Int, FK → User)
- `accepted` (Boolean, default false)
- `role` (enum MembershipRole: MEMBER, ADMIN, OWNER)
- Unique on `[userId, teamId]`

### 2.2 Scheduling Tables

#### **EventType**
Key fields (many, showing only scheduling-relevant ones):
- `id` (Int, PK, autoincrement)
- `title` (String)
- `slug` (String, unique per [userId] and [teamId])
- `description` (String?)
- `length` (Int) — duration in minutes
- **Buffer times:**
  - `beforeEventBuffer` (Int, default 0) — minutes blocked before meeting
  - `afterEventBuffer` (Int, default 0) — minutes blocked after meeting
- **Slot configuration:**
  - `slotInterval` (Int?) — granularity of slot times (e.g., 15 min slots for a 60 min event)
- **Booking window:**
  - `periodType` (enum PeriodType: UNLIMITED, ROLLING, ROLLING_WINDOW, RANGE)
  - `periodStartDate` (DateTime?)
  - `periodEndDate` (DateTime?)
  - `periodDays` (Int?)
  - `periodCountCalendarDays` (Boolean?)
- **Minimum notice:**
  - `minimumBookingNotice` (Int, default 120) — minutes before event
  - `minimumRescheduleNotice` (Int?)
- **Recurring events:**
  - `recurringEvent` (Json?) — stores recurrence rules
- **Seats / group events:**
  - `seatsPerTimeSlot` (Int?)
  - `seatsShowAttendees` (Boolean?)
  - `seatsShowAvailabilityCount` (Boolean?, default true)
- **Scheduling type (team events):**
  - `schedulingType` (enum SchedulingType: ROUND_ROBIN, COLLECTIVE, MANAGED)
- **Confirmation:**
  - `requiresConfirmation` (Boolean, default false)
  - `requiresConfirmationWillBlockSlot` (Boolean, default false)
- **Visibility / restrictions:**
  - `hidden` (Boolean, default false)
  - `disableGuests` (Boolean, default false)
  - `lockTimeZoneToggleOnBookingPage` (Boolean, default false)
  - `onlyShowFirstAvailableSlot` (Boolean, default false)
- **Time zone:**
  - `timeZone` (String?) — event-level timezone override
  - `useBookerTimezone` (Boolean, default false)
- **Metadata:**
  - `locations` (Json?) — meeting locations (video, phone, in-person)
  - `metadata` (Json?) — app-specific metadata (Stripe, etc.)
  - `bookingFields` (Json?) — custom booking form fields
  - `bookingLimits` (Json?) — per-day/week/month/year limits
  - `durationLimits` (Json?) — total duration limits
- **Relations:**
  - `hosts Host[]` — for team/collective events
  - `owner User?` / `userId Int?`
  - `team Team?` / `teamId Int?`
  - `schedule Schedule?` / `scheduleId Int?` — specific schedule override
  - `bookings Booking[]`
  - `availability Availability[]`
  - `webhooks Webhook[]`
  - `hashedLink HashedLink[]` — private/secret booking links
  - `children EventType[]` / `parent EventType?` — managed event types (templates)

#### **Host** (EventType ↔ User junction for multi-host/team events)
- Composite PK: `[userId, eventTypeId]`
- `isFixed` (Boolean, default false) — required host for round-robin
- `priority` (Int?) — host priority in round-robin
- `weight` (Int?) — weighted distribution for round-robin
- `scheduleId` (Int?, FK → Schedule) — per-host schedule override

#### **Schedule**
- `id` (Int, PK, autoincrement)
- `userId` (Int, FK → User)
- `name` (String)
- `timeZone` (String?) — schedule-level timezone
- Relations: `availability Availability[]`, `eventType EventType[]`

#### **Availability** (weekly recurring hours AND date-specific overrides)
- `id` (Int, PK, autoincrement)
- `userId` (Int?, FK → User) — user-level availability
- `eventTypeId` (Int?, FK → EventType) — event-type-specific availability
- `scheduleId` (Int?, FK → Schedule) — schedule-scoped availability
- `days` (Int[]) — days of week (0=Sun through 6=Sat)
- `startTime` (DateTime @db.Time) — wall-clock time
- `endTime` (DateTime @db.Time) — wall-clock time
- `date` (DateTime? @db.Date) — **when set: this is a date-specific override**, when null: recurring weekly

#### **SelectedCalendar** (connected external calendars for busy-time checking)
- `userId` (Int, FK → User)
- `integration` (String) — e.g., "google_calendar"
- `externalId` (String) — calendar ID
- `credentialId` (Int?, FK → Credential)
- `eventTypeId` (Int?, FK → EventType) — per-event-type calendar selection
- Channel tracking for push notifications (Google Calendar watch)

### 2.3 Booking Tables

#### **Booking**
- `id` (Int, PK, autoincrement)
- `uid` (String, unique) — external booking identifier
- `idempotencyKey` (String?, unique) — prevents duplicate bookings
- `user` / `userId` (FK → User) — host
- `eventType` / `eventTypeId` (FK → EventType)
- `title` (String)
- `description` (String?)
- `startTime` (DateTime) — UTC
- `endTime` (DateTime) — UTC
- `status` (enum BookingStatus: CANCELLED, ACCEPTED, REJECTED, PENDING, AWAITING_HOST)
- `location` (String?)
- `attendees` (Attendee[])
- `responses` (Json?) — booking form responses
- `customInputs` (Json?)
- `metadata` (Json?)
- **Reschedule support:**
  - `rescheduled` (Boolean?)
  - `fromReschedule` (String?) — UID of original booking
  - `rescheduledBy` (String?) — email of person who rescheduled
- **Cancellation:**
  - `cancellationReason` (String?)
  - `cancelledBy` (String?) — email of person who cancelled
- **Recurring:**
  - `recurringEventId` (String?) — groups recurring booking instances
- **Other:**
  - `paid` (Boolean, default false)
  - `destinationCalendar` / `destinationCalendarId` (FK)
  - `references` (BookingReference[]) — external calendar event IDs
  - `iCalUID` (String?)
  - `iCalSequence` (Int, default 0)
  - `noShowHost` (Boolean?, default false)
  - `rating` (Int?)
  - Indexes on: `[startTime, endTime, status]`, `[userId, status, startTime]`, `[eventTypeId, status]`, `[uid]`, `[recurringEventId]`

#### **Attendee**
- `id` (Int, PK, autoincrement)
- `email` (String)
- `name` (String)
- `timeZone` (String)
- `phoneNumber` (String?)
- `locale` (String?, default "en")
- `bookingId` (Int?, FK → Booking)
- `noShow` (Boolean?, default false)

#### **BookingReference** (external calendar event IDs)
- `type` (String) — e.g., "google_calendar", "office365_calendar"
- `uid` (String) — external event ID
- `meetingId` (String?)
- `meetingUrl` (String?)
- `meetingPassword` (String?)
- `bookingId` (Int?, FK → Booking)
- `credentialId` (Int?, FK → Credential)
- `thirdPartyRecurringEventId` (String?)

#### **BookingSeat** (for seated events)
- `id` (Int, PK, autoincrement)
- `referenceUid` (String, unique) — seat identifier
- `bookingId` (Int, FK → Booking)
- `attendeeId` (Int, unique, FK → Attendee)

#### **DestinationCalendar** (where to push events)
- `integration` (String) — "google_calendar", etc.
- `externalId` (String) — calendar ID
- `primaryEmail` (String?)
- `userId` (Int?, unique, FK → User) — user-level default
- `eventTypeId` (Int?, unique, FK → EventType) — event-type-level override

### 2.4 Integration Tables

#### **Credential** (OAuth tokens for external services)
- `id` (Int, PK)
- `type` (String) — app type
- `key` (Json) — OAuth token data
- `encryptedKey` (String?) — encrypted version
- `userId` (Int?, FK → User)
- `teamId` (Int?, FK → Team)
- `appId` (String?, FK → App)

#### **App** (App Store registry)
- `slug` (String, PK) — e.g., "google-calendar", "zoom"
- `dirName` (String, unique) — package directory
- `categories` (AppCategories[])
- `enabled` (Boolean, default false)
- `keys` (Json?) — required API keys schema

#### **Webhook**
- `id` (String, PK)
- `userId` (Int?), `teamId` (Int?), `eventTypeId` (Int?) — scope
- `subscriberUrl` (String)
- `eventTriggers` (WebhookTriggerEvents[]) — e.g., BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED, etc.
- `active` (Boolean, default true)
- `secret` (String?) — HMAC signing secret
- `payloadTemplate` (String?)
- `time` (Int?), `timeUnit` (TimeUnit?) — scheduled trigger delay

#### **Webhook Trigger Events** (enum)
BOOKING_CREATED, BOOKING_PAYMENT_INITIATED, BOOKING_PAID, BOOKING_RESCHEDULED, BOOKING_REQUESTED, BOOKING_CANCELLED, BOOKING_REJECTED, BOOKING_NO_SHOW_UPDATED, FORM_SUBMITTED, MEETING_ENDED, MEETING_STARTED, RECORDING_READY, RECORDING_TRANSCRIPTION_GENERATED, OOO_CREATED, etc.

### 2.5 Additional Models

- **Account** (NextAuth.js OAuth accounts): `provider`, `providerAccountId`, `access_token`, `refresh_token`, etc.
- **Session** (NextAuth.js sessions): `sessionToken`, `userId`, `expires`
- **ApiKey**: `hashedKey`, `userId`, `teamId`, `expiresAt`, `lastUsedAt`, `note`
- **VerificationToken**: `identifier`, `token`, `expires`
- **ResetPasswordRequest**: `email`, `expires`
- **Payment**: `uid`, `bookingId`, `amount`, `fee`, `currency`, `success`, `refunded`, `externalId`
- **OutOfOfficeEntry**: `userId`, `start`, `end`, `toUserId` — OOO redirect
- **TravelSchedule**: `userId`, `timeZone`, `startDate`, `endDate`, `prevTimeZone`
- **InstantMeetingToken**: for instant/on-demand bookings
- **ReminderMail**: `referenceId`, `reminderType`, `elapsedMinutes`

---

## 3. Availability Model

**Source:** `packages/lib/availability.ts`, `packages/prisma/schema.prisma` (Availability model)

Cal.com uses a sophisticated, layered availability system:

### 3.1 Availability Hierarchy

1. **Schedule** (named set of availability rules, e.g., "Work Hours", "Weekend")
2. **Availability** records within a schedule:
   - **Recurring weekly:** `days: [1,2,3,4,5]`, `startTime: "09:00"`, `endTime: "17:00"`, `date: null`
   - **Date-specific overrides:** `days: []`, `startTime: "10:00"`, `endTime: "14:00"`, `date: "2024-12-25"`
3. **Schedule assignment:**
   - User has a **default schedule** (`defaultScheduleId` on User)
   - EventType can override with a **specific schedule** (`scheduleId` on EventType)
   - Host can override with a **per-host schedule** (`scheduleId` on Host)
   - Team events may use **each host's schedule**

### 3.2 Working Hours Calculation

From `packages/lib/availability.ts`:
```typescript
export function getWorkingHours(
  relativeTimeUnit: { timeZone?: string; utcOffset?: number },
  availability: { userId?: number; days: number[]; startTime: ConfigType; endTime: ConfigType }[]
): WorkingHours[]
```

Key logic:
1. **Convert UTC times to local timezone** using the provided timezone or UTC offset
2. **Handle DST transitions**: availability times are stored in UTC without dates (just `@db.Time`), and the conversion is done using `dayjs.utc(schedule.startTime).get('hour')` which avoids DST date issues by working with UTC hours
3. **Handle overflow**: If start/end times cross day boundaries (e.g., 23:00-02:00), split into two working hours records spanning adjacent days
4. **Clamp times**: to 0-1439 minute range

### 3.3 Key Difference: Recurring vs Date Overrides

```prisma
model Availability {
  // Recurring: days populated, date = null
  days Int[]
  startTime DateTime @db.Time
  endTime   DateTime @db.Time
  
  // Date override: date populated, days = empty
  date DateTime? @db.Date
}
```

The `getWorkingHours` function explicitly **filters out date overrides** when computing weekly schedules:
```typescript
// Include only recurring weekly availability, not date overrides
if (!schedule.days.length) return currentWorkingHours;
```

Date overrides are handled separately in the booking/slot calculation logic.

### 3.4 Other Availability Features

- **TravelSchedule**: User can set timezone changes for travel, affecting slot availability
- **OutOfOfficeEntry**: Redirect bookings to another user during OOO periods
- **Calendar Busy Times**: External calendar busy times are fetched and merged into availability calculations
- **SelectedCalendar**: Users pick which calendars to check for busy times (per event type or globally)

---

## 4. Slot Calculation Algorithm

**Source:** Inferred from API docs (`GET /v2/slots`), `packages/lib/availability.ts`, API v2 schema for busy times

### 4.1 API Endpoint: GET /v2/slots

From the Cal.com API v2 docs (`cal.com/docs/api-reference/v2/slots`):

**Multiple ways to fetch slots:**
1. By **event type ID**: `?eventTypeId=10&start=2050-09-05&end=2050-09-06&timeZone=Europe/Rome`
2. By **slug + username**: `?eventTypeSlug=30min&username=alex&start=...&end=...`
3. By **slug + username + org**: `?organizationSlug=acme&eventTypeSlug=30min&username=alex&start=...&end=...`
4. By **usernames** (dynamic/collective): `?usernames=alice,bob&organizationSlug=acme&start=...&end=...`
5. By **team slug**: `?eventTypeSlug=30min&teamSlug=team-slug&start=...&end=...`

**Key parameters:**
- `start` / `end`: ISO 8601 UTC range
- `timeZone`: Timezone for returned slots (defaults to UTC)
- `duration`: For event types with multiple durations
- `format`: "time" (default, returns array of strings) or "range" (returns `{start, end}` objects)
- `bookingUidToReschedule`: Excludes original booking time from busy calculations (for reschedule flow)

**Response format:**
```json
{
  "status": "success",
  "data": {
    "2050-09-05": [
      { "start": "2050-09-05T09:00:00.000+02:00" }
    ],
    "2050-09-06": [
      { "start": "2050-09-06T09:00:00.000+02:00" }
    ]
  }
}
```

### 4.2 Busy Times API: GET /v2/calendars/busy-times

Returns busy time ranges from connected calendars:
- Accepts `dateFrom`, `dateTo` (ISO 8601 dates)
- Accepts `calendarsToLoad[]` as an array of `{credentialId, externalId}` objects
- Accepts `timeZone` parameter
- Returns `{start, end, source}` time ranges
- `source` can be null (user's own availability) or a calendar identifier

### 4.3 Slot Calculation Factors

Based on the EventType model fields and API behavior, the slot calculation considers:

1. **Availability windows** (from Schedule → Availability records)
2. **Event duration** (`length` in minutes)
3. **Slot interval** (`slotInterval`): Finer granularity for slot display (e.g., 15-min slots for 60-min event)
4. **Minimum booking notice** (`minimumBookingNotice`, default 120 min): Skip slots that start less than N minutes from now
5. **Buffer times:**
   - `beforeEventBuffer`: Block N minutes before each meeting
   - `afterEventBuffer`: Block N minutes after each meeting
6. **Date-specific overrides**: Override or extend weekly availability for specific dates
7. **External calendar busy times**: Merge with existing bookings and external calendar events
8. **Booking window** (`periodType`, `periodDays`, `periodStartDate`, `periodEndDate`): Limit how far into the future slots are shown
9. **Booking limits** (`bookingLimits`, `durationLimits`): Cap total bookings per day/week/month/year
10. **Seats** (`seatsPerTimeSlot`): Show slots with remaining capacity
11. **Reschedule exclusion** (`bookingUidToReschedule`): Show original slot as available when rescheduling
12. **Time zone handling:**
    - Availability stored as UTC times (no date)
    - Converted to the requested timezone using UTC offset
    - DST handled via timezone-aware date libraries (dayjs with timezone plugin)
13. **For team events (round-robin):**
    - Check each host's schedule
    - Apply priority ordering and weights
    - Only assign hosts that are available

### 4.4 Source Code Location

The core slot calculation logic likely lives in:
- `packages/features/bookings/lib/` (getSchedule directory)
- `packages/lib/availability.ts` (working hours utilities)
- API route handlers in `apps/api/` or tRPC procedures

---

## 5. API Design

### 5.1 API Architecture

Cal.com uses **two API surfaces:**

#### Internal API: tRPC
- End-to-end typesafe RPC between Next.js frontend and backend
- Procedures organized by domain: `bookings`, `eventTypes`, `availability`, `schedules`, `users`, `teams`
- Middleware: authentication, rate limiting, logging
- Source: `packages/trpc/`

#### Public API v2: REST (OpenAPI)
- RESTful API available at `api.cal.com/v2/`
- OpenAPI 3.0 spec generated from TypeScript controllers
- Authentication: API key (Bearer token), OAuth 2.0, or deprecated Platform credentials
- Rate limit: 120 req/min for API keys (increasable)

### 5.2 API v2 Endpoints (Key ones)

| Category | Method | Path | Description |
|----------|--------|------|-------------|
| **Bookings** | `POST` | `/v2/bookings` | Create regular/recurring/instant booking |
| Bookings | `GET` | `/v2/bookings/{uid}` | Get booking details |
| Bookings | `POST` | `/v2/bookings/{uid}/cancel` | Cancel booking |
| Bookings | `POST` | `/v2/bookings/{uid}/reschedule` | Reschedule booking |
| Bookings | `POST` | `/v2/bookings/{uid}/request-reschedule` | Request reschedule (host asks guest) |
| Bookings | `POST` | `/v2/bookings/{uid}/confirm` | Confirm pending booking |
| Bookings | `POST` | `/v2/bookings/{uid}/decline` | Decline booking |
| Bookings | `GET` | `/v2/bookings` | List all bookings (cursor pagination) |
| Bookings | `POST` | `/v2/bookings/{uid}/reassign` | Reassign booking host |
| **Slots** | `GET` | `/v2/slots` | Get available time slots |
| **Calendars** | `GET` | `/v2/calendars/busy-times` | Get busy times from connected calendars |
| Calendars | `GET` | `/v2/calendars` | List connected calendars |
| Calendars | `POST` | `/v2/calendars/connect` | Connect calendar |
| **Event Types** | `POST` | `/v2/event-types` | Create event type |
| Event Types | `GET` | `/v2/event-types/{id}` | Get event type |
| Event Types | `PATCH` | `/v2/event-types/{id}` | Update event type |
| Event Types | `DELETE` | `/v2/event-types/{id}` | Delete event type |
| Event Types | `GET` | `/v2/event-types` | List all event types |
| **Schedules** | `POST` | `/v2/schedules` | Create schedule |
| Schedules | `GET` | `/v2/schedules/{id}` | Get schedule |
| Schedules | `PATCH` | `/v2/schedules/{id}` | Update schedule |
| **Webhooks** | `POST` | `/v2/event-types/{id}/webhooks` | Create event-type webhook |
| **OAuth** | `POST` | `/v2/oauth/token` | Exchange code or refresh token |
| **Me** | `GET` | `/v2/me` | Get authenticated user's profile |
| Me | `PATCH` | `/v2/me` | Update authenticated user's profile |

### 5.3 Booking Creation API

The `POST /v2/bookings` endpoint accepts three input variants:
1. **`CreateBookingInput_2024_08_13`**: Regular booking
2. **`CreateInstantBookingInput_2024_08_13`**: Instant/on-demand booking (adds `"instant": true`)
3. **`CreateRecurringBookingInput_2024_08_13`**: Recurring booking (adds `recurrenceCount`)

Common fields:
- `start` (ISO 8601 UTC)
- `attendee`: `{name, email, timeZone, phoneNumber?, language?}`
- `eventTypeId` OR `eventTypeSlug` + `username`/`teamSlug`
- `organizationSlug` (optional)
- `guests` (string[] of emails)
- `location` (one of: address, link, phone, integration, attendeeAddress, etc.)
- `bookingFieldsResponses` (object)
- `metadata` (object, max 50 keys)
- `allowConflicts` (boolean) — skip availability checks for hosts

### 5.4 Authentication

Three methods:
1. **API Key**: `Authorization: Bearer cal_live_...` (live) or `Authorization: Bearer cal_...` (test)
2. **OAuth 2.0**: Standard RFC 6749, access tokens valid 60 min, refresh tokens 1 year
   - Grant types: `authorization_code`, `refresh_token`
   - Scopes: `PROFILE_READ`, `EVENT_TYPE_WRITE`, `BOOKING_READ`, `SCHEDULE_WRITE`, etc.
3. **Platform (deprecated)**: `x-cal-client-id` + `x-cal-secret-key` headers

Public endpoints (like slot fetching and booking creation) are **unauthenticated**.

### 5.5 Versioning

API versions are date-based and passed via `cal-api-version` header:
- `2024-06-11` for schedules
- `2024-06-14` for event types
- `2024-09-04` for slots
- `2026-02-25` for bookings
- Without header, defaults to older version

---

## 6. Core Features Comparison (MVP vs cal.com)

### 6.1 Features cal.com has that our MVP lacks

| Feature | cal.com Implementation | MVP Status |
|---------|----------------------|------------|
| **Multi-user / auth** | Full NextAuth.js with email+password and OAuth (Google, SAML, Azure AD). User registration flow. | Not implemented (single hardcoded user) |
| **Booking cancellation** | `POST /v2/bookings/{uid}/cancel` by host or attendee. Tracks `cancelledBy`, `cancellationReason`. | Not implemented |
| **Booking reschedule** | `POST /v2/bookings/{uid}/reschedule`. Tracks `fromReschedule`, `rescheduledBy`. Sends notification. | Not implemented |
| **Buffer time** | `beforeEventBuffer` + `afterEventBuffer` in minutes per EventType | Not implemented |
| **Date-specific overrides** | `Availability.date` field. Separate from weekly recurring in slot calcs. Supported in schedule API. | Not implemented (weekly recurring only) |
| **Video conferencing** | Cal Video (Daily.co), Zoom, Google Meet, MS Teams, +20 more apps. Credential + OAuth management. | Not implemented |
| **Email notifications** | React Email templates + SendGrid. Booking confirm, cancel, reschedule, reminder emails. | Not implemented |
| **Google Calendar sync** | OAuth2 + Google Calendar API. 2-way sync with push notifications (channel watching). | Not implemented |
| **Outlook sync** | Microsoft Graph API + OAuth2. Calendar busy time checking + event creation. | Not implemented |
| **Recurring events** | `recurringEvent` JSON on EventType. Generates multiple booking instances linked by `recurringEventId`. | Not implemented |
| **Collective events** | `schedulingType: COLLECTIVE` — all hosts must be available simultaneously. | Not implemented |
| **Round-robin** | `schedulingType: ROUND_ROBIN` — assigns to next available host with priority/weight support. | Not implemented |
| **Webhooks** | Per-user, per-team, per-event-type webhooks. 15+ event types. HMAC signing. | Not implemented |
| **Booking fields** | 20+ custom field types (text, number, select, radio, checkbox, phone, address, multi-email, URL). | Basic (name + email only) |
| **Seats** | `seatsPerTimeSlot` — multiple attendees per slot with capacity tracking. | Not implemented |
| **Private links** | `HashedLink` — secret booking links with expiration and usage limits. | Not implemented |
| **Booking limits** | Per day/week/month/year count and duration limits at event type level. | Not implemented |
| **Confirmation policies** | `requiresConfirmation` — bookings need host approval. `AWAITING_HOST` status. | Not implemented |
| **Time zone handling** | Booker timezone support (`useBookerTimezone`). Lock timezone toggle. Travel schedules. | Basic (host timezone only) |
| **Out of office** | OOO redirects bookings to another user during specified periods. | Not implemented |
| **Teams & Organizations** | Full org hierarchy with member management, roles, permissions, SSO, attribute-based routing. | Not implemented |
| **Routing forms** | Pre-booking forms that route to specific team members based on responses. | Not implemented |
| **Payments** | Stripe integration. Per-event-type pricing. Payment status tracking. | Not implemented |
| **Real-time** | Socket.io for live slot updates. Webhook scheduled triggers. | Not implemented |
| **i18n** | 40+ languages supported. Booking interface and emails translated. | English only |

### 6.2 What our MVP has that cal.com does differently

| Aspect | Our MVP | cal.com |
|--------|---------|---------|
| Database | SQLite (single file) | PostgreSQL |
| ORM | Drizzle | Prisma |
| API spec | TypeSpec → OpenAPI (schema-first) | tRPC (internal) + REST controllers (external) |
| Backend | Express 5 | Next.js API routes + tRPC |
| Frontend | React SPA (Vite) + Mantine | Next.js SSR/SPA + Tailwind |
| Availability | JSON blob in single row per user | Normalized `Availability` table with N records |
| Date library | luxon | dayjs with timezone plugin |

---

## 7. Summary of Key Architectural Insights

### 7.1 Schema Design Patterns

1. **Separate UserPassword model** — prevents password hash leakage through API responses
2. **Profile model** — decouples user identity from organization-specific profiles (username per org)
3. **Team as both Team and Organization** — same model with `isOrganization` flag and `parentId` self-reference
4. **Availability is fully normalized** — one row per day-range/time-window, not JSON blobs
5. **Booking ↔ BookingReference 1:N** — each booking can have multiple external calendar event references
6. **JSON metadata pattern** — `EventType.metadata` and `Booking.metadata` for extensible app-specific data
7. **Comprehensive indexing** — indices on `[startTime, endTime, status]`, `[userId, status, startTime]`, etc. for efficient slot queries

### 7.2 Slot Calculation Architecture

1. **Layered approach**: Schedule → Availability (recurring + overrides) → Working Hours → External Busy Times → Slot Generation
2. **Timezone-aware at every step**: Times stored as UTC without date context, converted per-query using the target timezone
3. **Buffer times are separate concepts**: `beforeEventBuffer` and `afterEventBuffer` block extra time around meetings
4. **Minimum notice prevents last-minute bookings**: Default 120 minutes, configurable per event type
5. **Date overrides are first-class**: Separated from recurring availability by the `date` field

### 7.3 API Design Patterns

1. **Dual API**: Internal tRPC (typesafe, for the web app) + External REST v2 (OpenAPI, for integrations)
2. **Date-based versioning**: API versions are dates like `2024-06-14`, passed as `cal-api-version` header
3. **Multiple ways to identify resources**: By ID or by slug+username+organizationSlug
4. **Idempotency keys**: Booking creation supports idempotency to prevent duplicates
5. **API versioning is NOT URL-based**: It's header-based, with fallback to older versions

### 7.4 Things Worth Adopting

1. **Normalize availability records** instead of JSON blobs — enables date overrides, per-event-type availability
2. **Separate buffer times** from event duration — cleaner semantics
3. **Minimum booking notice** as an EventType field (not hardcoded)
4. **Booking UID for reschedule exclusion** — pass `bookingUidToReschedule` to slot endpoint
5. **Slot interval vs duration** distinction — show finer granularity slots than the actual meeting length
6. **Idempotency key** for booking creation — prevents accidental double bookings
7. **Metadata JSON field** on EventType and Booking for extensibility
8. **Comprehensive indices** on bookings table — critical for slot calculation performance at scale

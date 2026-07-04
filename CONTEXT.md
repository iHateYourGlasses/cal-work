# cal-work

A simple scheduling tool: a Host creates meetings, shares a link, and Guests book available time slots.

## Language

**Host**:
The person who accepts meetings and owns the schedule.
_Avoid_: User, owner, account

**Guest**:
A person who books a slot on a Host's meeting.
_Avoid_: Visitor, attendee, customer

**Meeting**:
A template for a bookable meeting: title, duration, and a unique slug per Host.
_Avoid_: Event type, event, appointment

**Booking**:
A confirmed reservation by a Guest for a specific time slot of a Meeting.
_Avoid_: Reservation, appointment

**Availability**:
A weekly rule defining when a Host is available: days of week and time windows.
_Avoid_: Schedule, working hours

**Slot**:
A concrete free time interval, computed from Availability minus existing Bookings.
_Avoid_: Window, timeslot

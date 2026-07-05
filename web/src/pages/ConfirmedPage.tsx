import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Card,
  Center,
  Loader,
  ThemeIcon,
  Stack,
  Button,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCircleCheck, IconBrandGoogle, IconCalendarDown } from "@tabler/icons-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { api } from "../api/client";
import type { paths } from "../types/api";

dayjs.extend(utc);

type BookingData =
  paths["/api/bookings/{bookingId}"]["get"]["responses"]["200"]["content"]["application/json"];

export function ConfirmedPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    api
      .fetchBooking(Number(bookingId))
      .then(setBooking)
      .catch((err) => {
        notifications.show({
          title: "Error",
          message: String(err),
          color: "red",
        });
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!booking) {
    return (
      <Container size="sm" py="xl">
        <Text c="dimmed" ta="center">
          Booking not found.
        </Text>
      </Container>
    );
  }

  const start = dayjs.utc(booking.startTime);
  const end = dayjs.utc(booking.endTime);

  const gcalFormat = (d: dayjs.Dayjs) => d.format("YYYYMMDDTHHmmss") + "Z";

  const googleCalendarUrl = [
    "https://calendar.google.com/calendar/render?action=TEMPLATE",
    `&text=${encodeURIComponent(booking.eventType?.title ?? "Meeting")}`,
    `&dates=${gcalFormat(start)}/${gcalFormat(end)}`,
    `&details=${encodeURIComponent(`Booked by ${booking.guestName} (${booking.guestEmail})`)}`,
  ].join("");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//cal-work//EN",
    "BEGIN:VEVENT",
    `DTSTART:${gcalFormat(start)}`,
    `DTEND:${gcalFormat(end)}`,
    `SUMMARY:${booking.eventType?.title ?? "Meeting"}`,
    `DESCRIPTION:Booked by ${booking.guestName} (${booking.guestEmail})`,
    `UID:booking-${booking.id}@cal-work`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const downloadIcs = () => {
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${booking.eventType?.slug ?? "event"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container size="xs" py="xl">
      <Stack align="center" ta="center">
        <ThemeIcon color="green" size={64} radius="xl">
          <IconCircleCheck size={36} />
        </ThemeIcon>
        <Title order={2}>You're booked!</Title>

        {booking.eventType && (
          <Text size="lg" fw={500}>
            {booking.eventType.title}
          </Text>
        )}

        <Card withBorder p="lg" w="100%">
          <Stack gap="xs">
            <Text>
              <strong>When:</strong>{" "}
              {start.format("dddd, MMMM D, YYYY")}
            </Text>
            <Text>
              <strong>Time:</strong>{" "}
              {start.format("HH:mm")}
              {" — "}
              {end.format("HH:mm")}
              {" UTC"}
            </Text>
            <Text>
              <strong>Name:</strong> {booking.guestName}
            </Text>
            <Text>
              <strong>Email:</strong> {booking.guestEmail}
            </Text>
          </Stack>
        </Card>

        <Stack gap="sm" w="100%">
          <Button
            component="a"
            href={googleCalendarUrl}
            target="_blank"
            leftSection={<IconBrandGoogle size={18} />}
            variant="outline"
          >
            Add to Google Calendar
          </Button>
          <Button
            leftSection={<IconCalendarDown size={18} />}
            variant="outline"
            onClick={downloadIcs}
          >
            Download .ics file
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

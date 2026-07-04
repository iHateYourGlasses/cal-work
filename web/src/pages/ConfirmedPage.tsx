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
} from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";
import { api } from "../api/client";
import type { paths } from "../types/api";

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
      .catch(() => {})
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

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

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
              {start.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Text>
              <strong>Time:</strong>{" "}
              {start.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })}
              {" — "}
              {end.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })}
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

        <Text size="sm" c="dimmed">
          A confirmation has been sent to your email (not really — MVP,
          remember?).
        </Text>
      </Stack>
    </Container>
  );
}

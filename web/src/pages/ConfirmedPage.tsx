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
import { notifications } from "@mantine/notifications";
import { IconCircleCheck } from "@tabler/icons-react";
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

        <Text size="sm" c="dimmed">
          A confirmation has been sent to your email (not really — MVP,
          remember?).
        </Text>
      </Stack>
    </Container>
  );
}

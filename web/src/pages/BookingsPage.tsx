import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Table,
  Badge,
  Text,
  Center,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCalendarOff } from "@tabler/icons-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { api } from "../api/client";
import type { paths } from "../types/api";

dayjs.extend(utc);
dayjs.extend(timezone);

type Booking =
  paths["/api/bookings"]["get"]["responses"]["200"]["content"]["application/json"][number];

const HOST_TZ = "Europe/Moscow";

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getBookings()
      .then(setBookings)
      .catch((err) => {
        notifications.show({
          title: "Error",
          message: String(err),
          color: "red",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) =>
    dayjs.utc(iso).tz(HOST_TZ).format("D MMM YYYY, HH:mm");

  const isPast = (iso: string) => dayjs.utc(iso).isBefore(dayjs.utc());

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Text c="dimmed">Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="md">
        Bookings
      </Title>

      {bookings.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <IconCalendarOff size={48} stroke={1.2} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" size="lg">
              No bookings yet. Share your booking link to get started.
            </Text>
          </Stack>
        </Center>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Event Type</Table.Th>
              <Table.Th>Guest</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Date / Time</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bookings.map((b) => (
              <Table.Tr key={b.id}>
                <Table.Td>
                  <Text fw={500}>{b.eventType?.title ?? "—"}</Text>
                </Table.Td>
                <Table.Td>{b.guestName}</Table.Td>
                <Table.Td>{b.guestEmail}</Table.Td>
                <Table.Td>{formatTime(b.startTime)}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={isPast(b.endTime) ? "gray" : "green"}>
                    {isPast(b.endTime) ? "Past" : "Upcoming"}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}

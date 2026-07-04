import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Button,
  Group,
  Badge,
  TextInput,
  Box,
  Loader,
  Center,
  ScrollArea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { api } from "../api/client";
import type { paths } from "../types/api";

type Slot = { start: string; end: string };
type EventTypeInfo =
  paths["/api/book/{username}/{slug}/slots"]["get"]["responses"]["200"]["content"]["application/json"]["eventType"];

export function BookingPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [eventType, setEventType] = useState<EventTypeInfo | null>(null);
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    if (!username || !slug) return;
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    api
      .fetchSlots(username, slug, from, to)
      .then((data) => {
        setSlots(data.slots || []);
        setEventType(data.eventType);
        setTimezone(data.timezone);
      })
      .catch((err) => {
        notifications.show({
          title: "Error",
          message: String(err),
          color: "red",
        });
      })
      .finally(() => setLoading(false));
  }, [username, slug]);

  // Group slots by date
  const slotsByDate = new Map<string, Slot[]>();
  for (const slot of slots) {
    const dateKey = slot.start.slice(0, 10);
    if (!slotsByDate.has(dateKey)) slotsByDate.set(dateKey, []);
    slotsByDate.get(dateKey)!.push(slot);
  }
  const dates = Array.from(slotsByDate.keys()).sort();

  // Set initial date
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const formatDate = (dateKey: string) => {
    const d = new Date(dateKey + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !slug || !selectedSlot || !guestName || !guestEmail) {
      notifications.show({
        title: "Error",
        message: "Please fill all fields",
        color: "red",
      });
      return;
    }
    setBooking(true);
    try {
      const result = await api.createBooking(username, slug, {
        startTime: selectedSlot.start,
        guestName,
        guestEmail,
      });
      navigate(`/book/${username}/${slug}/confirmed/${result.id}`);
    } catch (err) {
      notifications.show({
        title: "Booking failed",
        message: String(err),
        color: "red",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!eventType) {
    return (
      <Container size="sm" py="xl">
        <Text c="dimmed" ta="center">
          Event type not found.
        </Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      {/* Header */}
      <Title order={3} mb="xs">
        {eventType.title}
      </Title>
      <Group gap="xs" mb="xl">
        <Badge variant="light">{eventType.duration} min</Badge>
        <Text size="sm" c="dimmed">
          {timezone}
        </Text>
      </Group>

      {selectedSlot ? (
        /* Step 2: Booking Form */
        <Box>
          <Card withBorder mb="md" bg="blue.0">
            <Text fw={600}>
              {new Date(selectedSlot.start).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {" — "}
              {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}{" "}
              {timezone ? `(${timezone})` : ""}
            </Text>
          </Card>

          <Button
            variant="subtle"
            mb="md"
            onClick={() => setSelectedSlot(null)}
          >
            ← Change time
          </Button>

          <form onSubmit={handleBook}>
            <Stack>
              <TextInput
                label="Your name"
                placeholder="John Doe"
                value={guestName}
                onChange={(e) => setGuestName(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Your email"
                placeholder="john@example.com"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.currentTarget.value)}
                required
              />
              <Button type="submit" loading={booking} fullWidth mt="md">
                Confirm Booking
              </Button>
            </Stack>
          </form>
        </Box>
      ) : (
        /* Step 1: Slot Selection */
        <Box>
          {dates.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No available slots for the next 7 days.
            </Text>
          ) : (
            <>
              {/* Date strip */}
              <ScrollArea mb="md">
                <Group gap="xs" wrap="nowrap">
                  {dates.map((dateKey) => (
                    <Button
                      key={dateKey}
                      variant={selectedDate === dateKey ? "filled" : "default"}
                      onClick={() => setSelectedDate(dateKey)}
                      size="sm"
                    >
                      {formatDate(dateKey)}
                    </Button>
                  ))}
                </Group>
              </ScrollArea>

              {/* Slots for selected date */}
              <Stack>
                {(slotsByDate.get(selectedDate) || []).map((slot) => (
                  <Card
                    key={slot.start}
                    withBorder
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <Text fw={500}>
                      {formatTime(slot.start)} — {formatTime(slot.end)} UTC
                    </Text>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </Box>
      )}
    </Container>
  );
}

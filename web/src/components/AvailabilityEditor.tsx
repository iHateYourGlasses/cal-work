import { useEffect, useState } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Checkbox,
  Select,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { api } from "../api/client";

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return [
    { value: `${h}:00`, label: `${h}:00` },
    { value: `${h}:30`, label: `${h}:30` },
  ];
}).flat();

type Slot = { dayOfWeek: number; start: string; end: string };

export function AvailabilityEditor() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getAvailability()
      .then((data) => {
        if (data?.slots) {
          setSlots(data.slots);
        }
      })
      .catch(() => {
        // no availability yet — empty state
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (dayOfWeek: number) => {
    setSlots((prev) => {
      const exists = prev.some((s) => s.dayOfWeek === dayOfWeek);
      if (exists) {
        return prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      }
      return [...prev, { dayOfWeek, start: "09:00", end: "17:00" }];
    });
  };

  const updateSlot = (
    dayOfWeek: number,
    field: "start" | "end",
    value: string,
  ) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateAvailability({ slots });
      notifications.show({
        title: "Saved",
        message: "Availability updated",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Error",
        message: String(err),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Text c="dimmed">Loading...</Text>;

  return (
    <Card withBorder>
      <Text size="sm" c="dimmed" mb="md">
        Select days and set your work hours. Times are in your timezone
        (Europe/Moscow).
      </Text>
      <Stack>
        {DAYS.map((day) => {
          const slot = slots.find((s) => s.dayOfWeek === Number(day.value));
          const active = !!slot;
          return (
            <Group key={day.value} gap="sm" wrap="nowrap">
              <Checkbox
                checked={active}
                onChange={() => toggleDay(Number(day.value))}
                label={day.label}
                style={{ minWidth: 120 }}
              />
              {active && (
                <Group gap="xs">
                  <Select
                    data={HOURS}
                    value={slot.start}
                    onChange={(val) =>
                      val && updateSlot(Number(day.value), "start", val)
                    }
                    size="sm"
                    w={100}
                  />
                  <Text size="sm">–</Text>
                  <Select
                    data={HOURS}
                    value={slot.end}
                    onChange={(val) =>
                      val && updateSlot(Number(day.value), "end", val)
                    }
                    size="sm"
                    w={100}
                  />
                </Group>
              )}
            </Group>
          );
        })}
      </Stack>
      <Button mt="md" onClick={handleSave} loading={saving}>
        Save Availability
      </Button>
    </Card>
  );
}

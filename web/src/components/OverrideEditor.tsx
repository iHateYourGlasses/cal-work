import { useEffect, useState } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Select,
  Badge,
  ActionIcon,
  Box,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { api } from "../api/client";
import { HOURS } from "../constants";

const TYPE_OPTIONS = [
  { value: "blocked", label: "Block Day" },
  { value: "custom", label: "Custom Hours" },
];

type Override = {
  id: number;
  date: string;
  type: string;
  start?: string;
  end?: string;
};

type DateSet = Set<string>;

export function OverrideEditor() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [overrideType, setOverrideType] = useState<string>("blocked");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");

  const fetchOverrides = () => {
    api
      .getOverrides()
      .then((data) => {
        setOverrides(data ?? []);
      })
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "Failed to load date overrides",
          color: "red",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  const blockedDates: DateSet = new Set(
    overrides.filter((o) => o.type === "blocked").map((o) => o.date),
  );
  const customDates: DateSet = new Set(
    overrides.filter((o) => o.type === "custom").map((o) => o.date),
  );

  const existingOverride = selectedDate
    ? overrides.find((o) => o.date === selectedDate) ?? null
    : null;

  const isCustom = overrideType === "custom";
  const isValid =
    selectedDate !== null &&
    (!isCustom || (startTime < endTime && startTime !== "" && endTime !== ""));

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date);
    if (date) {
      const existing = overrides.find((o) => o.date === date);
      if (existing) {
        setOverrideType(existing.type);
        if (existing.type === "custom") {
          setStartTime(existing.start ?? "09:00");
          setEndTime(existing.end ?? "17:00");
        }
      } else {
        setOverrideType("blocked");
        setStartTime("09:00");
        setEndTime("17:00");
      }
    }
  };

  const handleTypeChange = (val: string | null) => {
    if (!val) return;
    setOverrideType(val);
    if (val === "blocked") {
      setStartTime("09:00");
      setEndTime("17:00");
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !isValid) return;
    setSaving(true);
    try {
      await api.createOverride({
        date: selectedDate,
        type: overrideType,
        start: isCustom ? startTime : undefined,
        end: isCustom ? endTime : undefined,
      });
      notifications.show({
        title: existingOverride ? "Updated" : "Added",
        message: existingOverride
          ? "Override updated"
          : "Override added",
        color: "green",
      });
      setSelectedDate(null);
      setOverrideType("blocked");
      setStartTime("09:00");
      setEndTime("17:00");
      await fetchOverrides();
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

  const handleDelete = async (id: number) => {
    try {
      await api.deleteOverride(id);
      notifications.show({
        title: "Deleted",
        message: "Override removed",
        color: "green",
      });
      await fetchOverrides();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: String(err),
        color: "red",
      });
    }
  };

  const formatOverrideLabel = (o: Override) => {
    if (o.type === "blocked") return "Blocked";
    if (o.start && o.end) return `Custom ${o.start}–${o.end}`;
    return "Custom";
  };

  return (
    <Card withBorder mt="lg">
      <Title order={4} mb="md">
        Date Overrides
      </Title>
      <Text size="sm" c="dimmed" mb="md">
        Block specific dates or set custom hours that override your weekly
        schedule. Times are in your timezone (Europe/Moscow).
      </Text>

      <Group align="flex-start" gap="md" wrap="wrap">
        <Box style={{ flex: "1 1 300px" }}>
          <Stack>
            <DatePickerInput
              value={selectedDate}
              onChange={handleDateChange}
              label="Pick a date"
              placeholder="Select date"
              minDate={new Date()}
              clearable
              style={{ width: "100%" }}
              renderDay={(dateStr) => {
                const isBlocked = blockedDates.has(dateStr);
                const isCustom = customDates.has(dateStr);
                if (isBlocked || isCustom) {
                  return (
                    <Box
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        backgroundColor: isBlocked
                          ? "var(--mantine-color-red-light)"
                          : "var(--mantine-color-yellow-light)",
                        fontWeight: 600,
                      }}
                    >
                      {new Date(dateStr + "T00:00:00").getDate()}
                    </Box>
                  );
                }
                return undefined;
              }}
            />

            {existingOverride && (
              <Text size="sm" c="yellow">
                This date already has an override. Saving will update it.
              </Text>
            )}

            <Select
              data={TYPE_OPTIONS}
              value={overrideType}
              onChange={handleTypeChange}
              label="Type"
            />

            {isCustom && (
              <Group gap="xs">
                <Select
                  data={HOURS}
                  value={startTime}
                  onChange={(val) => val && setStartTime(val)}
                  label="Start"
                  size="sm"
                  w={100}
                />
                <Text size="sm" mt="xl">
                  –
                </Text>
                <Select
                  data={HOURS}
                  value={endTime}
                  onChange={(val) => val && setEndTime(val)}
                  label="End"
                  size="sm"
                  w={100}
                />
              </Group>
            )}

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleSave}
              loading={saving}
              disabled={!isValid}
            >
              {existingOverride ? "Update Override" : "Add Override"}
            </Button>
          </Stack>
        </Box>

        <Box style={{ flex: "1 1 300px" }}>
          {loading ? (
            <Text c="dimmed">Loading...</Text>
          ) : overrides.length === 0 ? (
            <Text c="dimmed">No date overrides</Text>
          ) : (
            <Stack gap="xs">
              {overrides.map((o) => (
                <Group key={o.id} gap="xs" wrap="nowrap">
                  <Badge
                    color={o.type === "blocked" ? "red" : "yellow"}
                    variant="light"
                  >
                    {formatOverrideLabel(o)}
                  </Badge>
                  <Text size="sm">{o.date}</Text>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => handleDelete(o.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </Box>
      </Group>
    </Card>
  );
}

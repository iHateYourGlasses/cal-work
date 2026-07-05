import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  Text,
  ActionIcon,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { api } from "../api/client";
import type { paths } from "../types/api";

type EventTypeData =
  paths["/api/event-types/{eventTypeId}"]["get"]["responses"]["200"]["content"]["application/json"];

const DURATION_OPTIONS = ["15", "30", "45", "60"];

export function EventTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getEventType(Number(id))
      .then((data) => {
        setTitle(data.title);
        setSlug(data.slug);
        setDuration(String(data.duration));
        setDescription(data.description ?? "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title || !duration) {
      notifications.show({
        title: "Error",
        message: "Please fill all required fields",
        color: "red",
      });
      return;
    }
    setSaving(true);
    try {
      await api.updateEventType(Number(id), {
        title,
        duration: Number(duration),
        description: description || undefined,
      });
      notifications.show({
        title: "Saved",
        message: "Event type updated",
        color: "green",
      });
      navigate("/dashboard");
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

  if (loading) {
    return (
      <Container size="xs" py="xl">
        <Text c="dimmed">Loading...</Text>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container size="xs" py="xl">
        <Text c="dimmed" ta="center">
          Event type not found.
        </Text>
      </Container>
    );
  }

  const bookingUrl = `${window.location.origin}/book/alex/${slug}`;

  return (
    <Container size="xs" py="xl">
      <Title order={2} mb="lg">
        Edit Event Type
      </Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Title"
            placeholder="30 Minute Consultation"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Booking link
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                {bookingUrl}
              </Text>
              <CopyButton value={bookingUrl} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copied" : "Copy"}>
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      variant="subtle"
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Stack>
          <Select
            label="Duration"
            data={DURATION_OPTIONS.map((d) => ({
              value: d,
              label: `${d} min`,
            }))}
            value={duration}
            onChange={setDuration}
            required
          />
          <Textarea
            label="Description"
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            autosize
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}

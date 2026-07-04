import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Card,
  Group,
  Badge,
  Button,
  Stack,
  Text,
  ActionIcon,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconPlus } from "@tabler/icons-react";
import { api } from "../api/client";
import type { paths } from "../types/api";

type EventType =
  paths["/api/event-types"]["get"]["responses"]["200"]["content"]["application/json"][number];

export function DashboardPage() {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEventTypes()
      .then(setEventTypes)
      .catch((err) => {
        notifications.show({
          title: "Error",
          message: String(err),
          color: "red",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/alex/${slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        notifications.show({ title: "Copied!", message: url, color: "green" });
      })
      .catch(() => {
        prompt("Copy this link:", url);
      });
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Your Event Types</Title>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={() => navigate("/dashboard/event-types/new")}
        >
          Create
        </Button>
      </Group>

      {loading ? (
        <Text c="dimmed">Loading...</Text>
      ) : eventTypes.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed" mb="md">
            No event types yet. Create your first one!
          </Text>
          <Button onClick={() => navigate("/dashboard/event-types/new")}>
            Create Event Type
          </Button>
        </Card>
      ) : (
        <Stack>
          {eventTypes.map((et) => (
            <Card key={et.slug} withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Box>
                  <Group gap="xs" mb={4}>
                    <Text fw={600}>{et.title}</Text>
                    <Badge size="sm" variant="light">
                      {et.duration} min
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    /book/alex/{et.slug}
                  </Text>
                </Box>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={() => copyLink(et.slug)}
                  title="Copy booking link"
                >
                  <IconCopy size={18} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

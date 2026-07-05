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
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconPlus, IconTrash, IconPencil } from "@tabler/icons-react";
import { api } from "../api/client";
import type { paths } from "../types/api";

type EventType =
  paths["/api/event-types"]["get"]["responses"]["200"]["content"]["application/json"][number];

export function DashboardPage() {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  const loadEventTypes = () => {
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
  };

  useEffect(loadEventTypes, []);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteEventType(deleteTarget.id);
      notifications.show({
        title: "Deleted",
        message: `"${deleteTarget.title}" removed`,
        color: "green",
      });
      setEventTypes((prev) => prev.filter((et) => et.id !== deleteTarget.id));
      closeDelete();
    } catch (err) {
      notifications.show({
        title: "Error",
        message: String(err),
        color: "red",
      });
    } finally {
      setDeleting(false);
    }
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
            <Card
              key={et.id}
              withBorder
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/dashboard/event-types/${et.id}/edit`)}
            >
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
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/event-types/${et.id}/edit`);
                    }}
                    title="Edit"
                  >
                    <IconPencil size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLink(et.slug);
                    }}
                    title="Copy booking link"
                  >
                    <IconCopy size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(et);
                      openDelete();
                    }}
                    title="Delete"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Delete Event Type"
        centered
      >
        <Text mb="lg">
          Are you sure you want to delete "{deleteTarget?.title}"? This cannot
          be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

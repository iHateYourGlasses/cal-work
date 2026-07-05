import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { api } from "../api/client";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DURATION_OPTIONS = ["15", "30", "45", "60"];

export function EventTypeCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState<string | null>("30");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !duration) {
      notifications.show({
        title: "Error",
        message: "Please fill all required fields",
        color: "red",
      });
      return;
    }
    setSaving(true);
    try {
      await api.createEventType({
        title,
        slug,
        duration: Number(duration),
        description: description || undefined,
      });
      notifications.show({
        title: "Created!",
        message: "Event type created",
        color: "green",
      });
      navigate("/dashboard");
    } catch (err) {
      // Slug conflict returns HTTP error
      notifications.show({
        title: "Error",
        message: String(err),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Title order={2} mb="lg">
        New Event Type
      </Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Title"
            placeholder="30 Minute Consultation"
            value={title}
            onChange={(e) => handleTitleChange(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Slug"
            placeholder="30min"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.currentTarget.value));
              setIsSlugManuallyEdited(true);
            }}
            required
            description="URL-friendly identifier (letters, numbers, hyphens)"
          />
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
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  );
}

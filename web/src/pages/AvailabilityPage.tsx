import { Container, Title } from "@mantine/core";
import { AvailabilityEditor } from "../components/AvailabilityEditor";

export function AvailabilityPage() {
  return (
    <Container size="md" py="xl">
      <Title order={2} mb="lg">
        Availability
      </Title>
      <AvailabilityEditor />
    </Container>
  );
}

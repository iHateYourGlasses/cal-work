import { Outlet, Link } from "react-router-dom";
import { AppShell, Group, Title, Text } from "@mantine/core";

export function Layout() {
  return (
    <AppShell header={{ height: 56 }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Link to="/dashboard" style={{ textDecoration: "none" }}>
            <Title order={3} c="blue">
              cal-work
            </Title>
          </Link>
          <Text size="sm" c="dimmed">
            alex
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

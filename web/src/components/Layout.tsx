import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell, Group, Text, NavLink, Stack } from "@mantine/core";
import { IconCalendarEvent, IconClock, IconCalendarTime } from "@tabler/icons-react";

const NAV_ITEMS = [
  { label: "Event Types", path: "/dashboard", icon: IconCalendarEvent },
  { label: "Availability", path: "/dashboard/availability", icon: IconClock },
  { label: "Bookings", path: "/dashboard/bookings", icon: IconCalendarTime },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide sidebar on booking pages
  const isBookingPage = location.pathname.startsWith("/book");

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={isBookingPage ? undefined : { width: 240, breakpoint: "sm" }}
      padding={isBookingPage ? 0 : "md"}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text
            fw={700}
            size="lg"
            c="blue"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            cal-work
          </Text>
          <Text size="sm" c="dimmed">
            alex
          </Text>
        </Group>
      </AppShell.Header>

      {!isBookingPage && (
        <AppShell.Navbar p="sm">
          <Stack gap={4}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<item.icon size={18} />}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                variant="light"
                style={{ borderRadius: 8 }}
              />
            ))}
          </Stack>
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

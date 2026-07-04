import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { EventTypeCreatePage } from "./pages/EventTypeCreatePage";
import { BookingPage } from "./pages/BookingPage";
import { ConfirmedPage } from "./pages/ConfirmedPage";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light">
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/dashboard/event-types/new"
              element={<EventTypeCreatePage />}
            />
            <Route path="/book/:username/:slug" element={<BookingPage />} />
            <Route
              path="/book/:username/:slug/confirmed/:bookingId"
              element={<ConfirmedPage />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);

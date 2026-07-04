import express from "express";
import { calendarsRouter } from "./routes/calendars.js";
import { eventsRouter } from "./routes/events.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Mount route modules
app.use("/calendars", calendarsRouter);
app.use("/events", eventsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`cal-work API running on http://localhost:${PORT}`);
});

import express from "express";
import { middleware } from "express-openapi-validator";
import { getDb } from "./db/index.js";
import { eventTypesRouter } from "./routes/eventTypes.js";
import { availabilityRouter } from "./routes/availability.js";
import { bookingRouter } from "./routes/booking.js";

export function createApp(options?: { validateResponses?: boolean }) {
  const validateResponses = options?.validateResponses ?? true;

  getDb();

  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    middleware({
      apiSpec: "../openapi.yaml",
      validateRequests: true,
      validateResponses,
    }),
  );

  app.use("/api/event-types", eventTypesRouter);
  app.use("/api/availability", availabilityRouter);
  app.use("/api", bookingRouter);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status ?? 500).json({
      message: err.message,
      errors: err.errors,
    });
  });

  return app;
}

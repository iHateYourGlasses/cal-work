import express from "express";
import { middleware } from "express-openapi-validator";
import { initDb } from "./db/index.js";

const app = express();
const PORT = 3000;

initDb();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  middleware({
    apiSpec: "../openapi.yaml",
    validateRequests: true,
    validateResponses: true,
  }),
);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status ?? 500).json({
    message: err.message,
    errors: err.errors,
  });
});

app.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
});

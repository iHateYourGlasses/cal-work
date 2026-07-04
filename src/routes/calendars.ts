import { Router, Request, Response } from "express";

export const calendarsRouter = Router();

// GET /calendars – list all calendars
calendarsRouter.get("/", (_req: Request, res: Response) => {
  res.json({ message: "TODO: list calendars" });
});

// POST /calendars – create a calendar
calendarsRouter.post("/", (req: Request, res: Response) => {
  res.status(201).json({ message: "TODO: create calendar", body: req.body });
});

// GET /calendars/:calendarId – get a calendar by ID
calendarsRouter.get("/:calendarId", (req: Request, res: Response) => {
  res.json({ message: "TODO: get calendar", id: req.params.calendarId });
});

// PATCH /calendars/:calendarId – update a calendar
calendarsRouter.patch("/:calendarId", (req: Request, res: Response) => {
  res.json({
    message: "TODO: update calendar",
    id: req.params.calendarId,
    body: req.body,
  });
});

// DELETE /calendars/:calendarId – delete a calendar
calendarsRouter.delete("/:calendarId", (req: Request, res: Response) => {
  res.status(204).send();
});

// GET /calendars/:calendarId/events – list events for a calendar
calendarsRouter.get("/:calendarId/events", (req: Request, res: Response) => {
  res.json({
    message: "TODO: list events",
    calendarId: req.params.calendarId,
    query: req.query,
  });
});

// POST /calendars/:calendarId/events – create an event in a calendar
calendarsRouter.post("/:calendarId/events", (req: Request, res: Response) => {
  res.status(201).json({
    message: "TODO: create event",
    calendarId: req.params.calendarId,
    body: req.body,
  });
});

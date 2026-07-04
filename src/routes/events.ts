import { Router, Request, Response } from "express";

export const eventsRouter = Router();

// GET /events/:eventId – get an event by ID
eventsRouter.get("/:eventId", (req: Request, res: Response) => {
  res.json({ message: "TODO: get event", id: req.params.eventId });
});

// PATCH /events/:eventId – update an event
eventsRouter.patch("/:eventId", (req: Request, res: Response) => {
  res.json({
    message: "TODO: update event",
    id: req.params.eventId,
    body: req.body,
  });
});

// DELETE /events/:eventId – delete an event
eventsRouter.delete("/:eventId", (req: Request, res: Response) => {
  res.status(204).send();
});

import { Router, type IRouter } from "express";
import {
  CreateToolRequestBody,
  CreateToolRequestResponse,
} from "@workspace/api-zod";
import { db, toolRequestsTable } from "@workspace/db";
import { rateLimit } from "../middlewares/rate-limit";

const router: IRouter = Router();

/** Pragmatic shape check — full RFC validation is not the goal. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Human-submitted forms — a handful per minute per IP is plenty. */
const limiter = rateLimit({ windowMs: 60_000, max: 10 });

/** Submit a "request a tool" entry or a notify-me email capture. */
router.post("/tool-requests", limiter, async (req, res, next) => {
  try {
    const parsed = CreateToolRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: "Please check the submitted fields and try again.",
      });
      return;
    }
    const body = parsed.data;

    const requestText = body.requestText.trim();
    if (!requestText) {
      res.status(400).json({
        error: "validation_error",
        message: "Request text cannot be empty.",
      });
      return;
    }

    const email = body.email?.trim() || null;
    if (email && !EMAIL_RE.test(email)) {
      res.status(400).json({
        error: "validation_error",
        message: "Please provide a valid email address.",
      });
      return;
    }

    const [created] = await db
      .insert(toolRequestsTable)
      .values({
        requestText,
        currentCostText: body.currentCostText?.trim() || null,
        email,
      })
      .returning({ id: toolRequestsTable.id });

    res.status(201).json(CreateToolRequestResponse.parse({ id: created.id }));
  } catch (err) {
    next(err);
  }
});

export default router;

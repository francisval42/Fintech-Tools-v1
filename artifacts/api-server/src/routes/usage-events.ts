import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { LogUsageEventBody, LogUsageEventResponse } from "@workspace/api-zod";
import { db, toolsTable, usageEventsTable } from "@workspace/db";
import { rateLimit } from "../middlewares/rate-limit";

const router: IRouter = Router();

/** Pseudo-slugs for site-level events (e.g. header signup prompt). */
const PSEUDO_SLUGS = new Set(["site"]);

/** Serialized payload cap — real payloads are a handful of calculator inputs. */
const MAX_PAYLOAD_BYTES = 4096;

/** Legit telemetry is debounced client-side (~1.5s), so 60/min is generous. */
const limiter = rateLimit({ windowMs: 60_000, max: 60 });

/** Log an anonymous usage event (calculate / notify_me). */
router.post("/usage-events", limiter, async (req, res, next) => {
  try {
    const parsed = LogUsageEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: "Invalid usage event.",
      });
      return;
    }
    const body = parsed.data;

    const payload = (body.payload ?? {}) as Record<string, unknown>;
    if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
      res.status(400).json({
        error: "payload_too_large",
        message: "Event payload is too large.",
      });
      return;
    }

    if (!PSEUDO_SLUGS.has(body.toolSlug)) {
      const known = await db
        .select({ id: toolsTable.id })
        .from(toolsTable)
        .where(eq(toolsTable.slug, body.toolSlug))
        .limit(1);
      if (known.length === 0) {
        res.status(400).json({
          error: "unknown_tool",
          message: "Unknown tool slug.",
        });
        return;
      }
    }

    const [created] = await db
      .insert(usageEventsTable)
      .values({
        toolSlug: body.toolSlug,
        eventType: body.eventType,
        payload,
      })
      .returning({ id: usageEventsTable.id });

    res.status(201).json(LogUsageEventResponse.parse({ id: created.id }));
  } catch (err) {
    next(err);
  }
});

export default router;

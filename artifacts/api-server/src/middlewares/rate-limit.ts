import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP.
 * Per-process only (each instance enforces independently), which is
 * sufficient to stop trivial scripted flooding of the public POST
 * endpoints without adding a dependency or shared state.
 */
export function rateLimit({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}) {
  const buckets = new Map<string, Bucket>();

  // Drop expired buckets so the map cannot grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, windowMs);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      res.status(429).json({
        error: "rate_limited",
        message: "Too many requests — please slow down and try again shortly.",
      });
      return;
    }

    bucket.count += 1;
    next();
  };
}

import { seedTools } from "@workspace/db/seed";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  // Idempotent upsert of canonical tool content so fresh databases
  // (e.g. production) serve the directory without manual seeding.
  try {
    await seedTools();
    logger.info("Tool content seeded");
  } catch (err) {
    logger.error(
      { err },
      "Tool content seeding failed — /api/tools may be empty or stale",
    );
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

void start();

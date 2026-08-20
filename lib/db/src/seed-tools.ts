import { eq } from "drizzle-orm";
import { db } from "./index";
import { toolsTable } from "./schema";
import toolContentJson from "./tool-content.json";

type ToolSeed = typeof toolsTable.$inferInsert;

/**
 * Canonical tool content for fintechtools.com.au (Phase 1).
 * The content itself lives in ./tool-content.json so that build tooling
 * (e.g. the frontend prerender step) can consume the same source of truth
 * without a database or TypeScript toolchain. Code remains the source of
 * truth for tool content until the Phase 3 admin exists: seeding runs on
 * API-server boot and upserts by slug, so edits to the JSON reach every
 * environment (including fresh production databases) automatically.
 */
const TOOLS: ToolSeed[] = toolContentJson.map((t) => ({
  ...t,
  status: t.status as ToolSeed["status"],
}));

/** Idempotent upsert of the canonical tool rows (update-by-slug, insert if missing). */
export async function seedTools(): Promise<void> {
  for (const tool of TOOLS) {
    const updated = await db
      .update(toolsTable)
      .set({
        name: tool.name,
        blurb: tool.blurb,
        status: tool.status,
        sortOrder: tool.sortOrder,
        seoTitle: tool.seoTitle,
        seoDescription: tool.seoDescription,
        pageCopy: tool.pageCopy,
      })
      .where(eq(toolsTable.slug, tool.slug))
      .returning({ id: toolsTable.id });
    if (updated.length === 0) {
      await db.insert(toolsTable).values(tool);
    }
  }
}

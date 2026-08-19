import { Router, type IRouter } from "express";
import {
  ListToolsResponse,
  GetToolBySlugParams,
  GetToolBySlugResponse,
} from "@workspace/api-zod";
import { db, toolsTable } from "@workspace/db";
import { and, asc, eq, ne } from "drizzle-orm";

const router: IRouter = Router();

/** List visible tools (live + coming_soon), ordered by sortOrder. Hidden excluded. */
router.get("/tools", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        slug: toolsTable.slug,
        name: toolsTable.name,
        blurb: toolsTable.blurb,
        status: toolsTable.status,
        sortOrder: toolsTable.sortOrder,
      })
      .from(toolsTable)
      .where(ne(toolsTable.status, "hidden"))
      .orderBy(asc(toolsTable.sortOrder), asc(toolsTable.name));

    res.json(ListToolsResponse.parse(rows));
  } catch (err) {
    next(err);
  }
});

/** Full tool detail by slug; 404 for unknown or hidden tools. */
router.get("/tools/:slug", async (req, res, next) => {
  try {
    const params = GetToolBySlugParams.safeParse(req.params);
    if (!params.success) {
      res
        .status(400)
        .json({ error: "validation_error", message: "Invalid request" });
      return;
    }
    const { slug } = params.data;

    const rows = await db
      .select({
        slug: toolsTable.slug,
        name: toolsTable.name,
        blurb: toolsTable.blurb,
        status: toolsTable.status,
        sortOrder: toolsTable.sortOrder,
        seoTitle: toolsTable.seoTitle,
        seoDescription: toolsTable.seoDescription,
        pageCopy: toolsTable.pageCopy,
      })
      .from(toolsTable)
      .where(and(eq(toolsTable.slug, slug), ne(toolsTable.status, "hidden")))
      .limit(1);

    const tool = rows[0];
    if (!tool) {
      res.status(404).json({ error: "not_found", message: "Tool not found" });
      return;
    }

    res.json(GetToolBySlugResponse.parse(tool));
  } catch (err) {
    next(err);
  }
});

export default router;

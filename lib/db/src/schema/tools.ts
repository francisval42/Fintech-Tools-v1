import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const toolStatusValues = ["live", "coming_soon", "hidden"] as const;
export type ToolStatusValue = (typeof toolStatusValues)[number];

export const toolsTable = pgTable("tools", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull(),
  status: text("status", { enum: toolStatusValues })
    .notNull()
    .default("coming_soon"),
  sortOrder: integer("sort_order").notNull().default(0),
  seoTitle: text("seo_title").notNull(),
  seoDescription: text("seo_description").notNull(),
  /** Constrained markdown: "## How it works", "## Who it's for", "## FAQ" with "### Question" pairs */
  pageCopy: text("page_copy").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertToolSchema = createInsertSchema(toolsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof toolsTable.$inferSelect;

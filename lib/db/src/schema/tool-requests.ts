import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** "Request a tool" submissions and notify-me email captures. */
export const toolRequestsTable = pgTable("tool_requests", {
  id: serial("id").primaryKey(),
  requestText: text("request_text").notNull(),
  currentCostText: text("current_cost_text"),
  email: text("email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertToolRequestSchema = createInsertSchema(toolRequestsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertToolRequest = z.infer<typeof insertToolRequestSchema>;
export type ToolRequest = typeof toolRequestsTable.$inferSelect;

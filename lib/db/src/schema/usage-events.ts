import { pgTable, serial, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usageEventTypeValues = ["calculate", "notify_me"] as const;
export type UsageEventTypeValue = (typeof usageEventTypeValues)[number];

/** Anonymous usage events (no user identification in v1). */
export const usageEventsTable = pgTable(
  "usage_events",
  {
    id: serial("id").primaryKey(),
    toolSlug: text("tool_slug").notNull(),
    eventType: text("event_type", { enum: usageEventTypeValues }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("usage_events_tool_slug_idx").on(table.toolSlug),
    index("usage_events_created_at_idx").on(table.createdAt),
  ],
);

export const insertUsageEventSchema = createInsertSchema(usageEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type UsageEvent = typeof usageEventsTable.$inferSelect;

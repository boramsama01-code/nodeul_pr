import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promotionRequestsTable = pgTable("promotion_requests", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  zoneId: integer("zone_id").notNull(),
  status: text("status").notNull().default("pending"),
  requestedStartDate: text("requested_start_date").notNull(),
  requestedEndDate: text("requested_end_date").notNull(),
  notes: text("notes"),
  adminComment: text("admin_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPromotionRequestSchema = createInsertSchema(promotionRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPromotionRequest = z.infer<typeof insertPromotionRequestSchema>;
export type PromotionRequest = typeof promotionRequestsTable.$inferSelect;

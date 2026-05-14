import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promotionZonesTable = pgTable("promotion_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  color: text("color"),
  requiresEndDate: boolean("requires_end_date").notNull().default(true),
  requiresAssetUpload: boolean("requires_asset_upload").notNull().default(true),
  allowMultipleFiles: boolean("allow_multiple_files").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  // null = 무제한, 1 = 하루 1개만, 2+ = 동시 N개까지
  maxConcurrent: integer("max_concurrent"),
});

export const insertPromotionZoneSchema = createInsertSchema(promotionZonesTable).omit({ id: true });
export type InsertPromotionZone = z.infer<typeof insertPromotionZoneSchema>;
export type PromotionZone = typeof promotionZonesTable.$inferSelect;

import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promotionZonesTable = pgTable("promotion_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  color: text("color"),
});

export const insertPromotionZoneSchema = createInsertSchema(promotionZonesTable).omit({ id: true });
export type InsertPromotionZone = z.infer<typeof insertPromotionZoneSchema>;
export type PromotionZone = typeof promotionZonesTable.$inferSelect;

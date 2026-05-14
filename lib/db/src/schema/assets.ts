import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  zoneId: integer("zone_id"),
  status: text("status").notNull().default("pending_review"),
  selectedVersionId: integer("selected_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const assetVersionsTable = pgTable("asset_versions", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  changeMemo: text("change_memo"),
  adminComment: text("admin_comment"),
  isSelected: boolean("is_selected").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetVersionSchema = createInsertSchema(assetVersionsTable).omit({ id: true, uploadedAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type InsertAssetVersion = z.infer<typeof insertAssetVersionSchema>;
export type Asset = typeof assetsTable.$inferSelect;
export type AssetVersion = typeof assetVersionsTable.$inferSelect;

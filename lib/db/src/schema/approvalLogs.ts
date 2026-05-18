import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * 승인 로그 — 워크플로우 상태 변경 이력
 * 신청됨 → 승인대기 → 수정요청 → 재업로드됨 → 최종승인 → 게시예정 → 게시완료
 */
export const approvalLogsTable = pgTable("approval_logs", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorUserId: text("actor_user_id"),
  actorName: text("actor_name"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApprovalLogSchema = createInsertSchema(approvalLogsTable).omit({ id: true, createdAt: true });
export type InsertApprovalLog = z.infer<typeof insertApprovalLogSchema>;
export type ApprovalLog = typeof approvalLogsTable.$inferSelect;

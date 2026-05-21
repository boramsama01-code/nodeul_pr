import { Router } from "express";
import { db, eventsTable, promotionRequestsTable, schedulesTable, commentsTable, promotionZonesTable, usersTable, systemSettingsTable, organizationsTable } from "@workspace/db";
import { eq, sql, desc, asc, and, gte, lte, inArray } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";

const router = Router();

async function requireAdmin(req: any, res: any) {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, userId) });
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) { res.status(403).json({ error: "Forbidden" }); return null; }
  return user;
}

router.get("/admin/dashboard", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const [pendingRequests, allEvents, todaySchedRows, allComments] = await Promise.all([
    db.select().from(promotionRequestsTable).where(eq(promotionRequestsTable.status, "pending")),
    db.select().from(eventsTable).orderBy(desc(eventsTable.updatedAt)).limit(10),
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const rows = await db.select({ sched: schedulesTable, eventTitle: eventsTable.title, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type, zoneColor: promotionZonesTable.color })
        .from(schedulesTable)
        .leftJoin(eventsTable, eq(schedulesTable.eventId, eventsTable.id))
        .leftJoin(promotionZonesTable, eq(schedulesTable.zoneId, promotionZonesTable.id));
      return rows.filter(r => r.sched.startDate <= today && r.sched.endDate >= today);
    })(),
    db.select().from(commentsTable),
  ]);

  const revisionRequests = await db.select().from(promotionRequestsTable).where(eq(promotionRequestsTable.status, "revision_requested"));
  const newSubmissions = allEvents.filter(e => e.status === "submitted");

  const statusBreakdown = { draft: 0, submitted: 0, approved: 0, revision_requested: 0, rejected: 0, completed: 0 };
  for (const ev of allEvents) {
    const s = ev.status as keyof typeof statusBreakdown;
    if (s in statusBreakdown) statusBreakdown[s]++;
  }

  const recentEventSlice = allEvents.slice(0, 5);
  const orgIds = recentEventSlice.map(e => e.organizationId).filter(Boolean) as number[];
  const orgs = orgIds.length > 0
    ? await db.select({ id: organizationsTable.id, name: organizationsTable.name }).from(organizationsTable).where(inArray(organizationsTable.id, orgIds))
    : [];
  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));

  return res.json({
    pendingApprovalCount: newSubmissions.length,
    revisionRequestCount: revisionRequests.length,
    todayScheduleCount: todaySchedRows.length,
    conflictCount: 0,
    newSubmissionsCount: newSubmissions.length,
    recentlyUpdatedCount: allEvents.length,
    unreadCommentsCount: allComments.length,
    statusBreakdown,
    recentEvents: recentEventSlice.map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? null,
      status: ev.status,
      organizationId: ev.organizationId,
      organizationName: ev.organizationId ? (orgMap[ev.organizationId] ?? null) : null,
      contactName: ev.contactName ?? null,
      contactEmail: ev.contactEmail ?? null,
      startDate: ev.startDate,
      endDate: ev.endDate,
      venue: ev.venue ?? null,
      tags: ev.tags ?? [],
      adminNote: ev.adminNote ?? null,
      createdAt: ev.createdAt.toISOString(),
      updatedAt: ev.updatedAt.toISOString(),
    })),
    todaySchedules: todaySchedRows.map(r => ({
      id: r.sched.id,
      eventId: r.sched.eventId,
      eventTitle: r.eventTitle ?? null,
      zoneId: r.sched.zoneId,
      zoneName: r.zoneName ?? null,
      zoneType: r.zoneType ?? null,
      zoneColor: r.zoneColor ?? null,
      startDate: r.sched.startDate,
      endDate: r.sched.endDate,
      status: r.sched.status,
      assetVersionId: r.sched.assetVersionId ?? null,
      notes: r.sched.notes ?? null,
      createdAt: r.sched.createdAt.toISOString(),
    })),
  });
});

router.get("/admin/conflicts", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const schedules = await db.select({ sched: schedulesTable, zoneName: promotionZonesTable.name, eventTitle: eventsTable.title })
    .from(schedulesTable)
    .leftJoin(promotionZonesTable, eq(schedulesTable.zoneId, promotionZonesTable.id))
    .leftJoin(eventsTable, eq(schedulesTable.eventId, eventsTable.id));

  const conflicts: any[] = [];
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i].sched;
      const b = schedules[j].sched;
      if (a.zoneId === b.zoneId && a.startDate <= b.endDate && a.endDate >= b.startDate) {
        conflicts.push({
          zoneId: a.zoneId,
          zoneName: schedules[i].zoneName ?? "",
          conflictingEventId: b.eventId,
          conflictingEventTitle: schedules[j].eventTitle ?? `이벤트 #${b.eventId}`,
          startDate: b.startDate,
          endDate: b.endDate,
        });
      }
    }
  }
  return res.json(conflicts);
});

router.get("/admin/calendar", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const startDate = `${month}-01`;
  const lastDay = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const [rows, approvedEvents] = await Promise.all([
    db.select({
      sched: schedulesTable,
      eventTitle: eventsTable.title,
      eventStatus: eventsTable.status,
      zoneName: promotionZonesTable.name,
      zoneType: promotionZonesTable.type,
      zoneColor: promotionZonesTable.color,
    })
      .from(schedulesTable)
      .leftJoin(eventsTable, eq(schedulesTable.eventId, eventsTable.id))
      .leftJoin(promotionZonesTable, eq(schedulesTable.zoneId, promotionZonesTable.id))
      .where(and(
        lte(schedulesTable.startDate, endDate),
        gte(schedulesTable.endDate, startDate),
      )),
    db.select({ id: eventsTable.id, title: eventsTable.title, status: eventsTable.status, startDate: eventsTable.startDate, endDate: eventsTable.endDate })
      .from(eventsTable)
      .where(and(
        lte(eventsTable.startDate, endDate),
        gte(eventsTable.endDate, startDate),
        inArray(eventsTable.status, ["approved", "submitted", "revision_requested"]),
      )),
  ]);

  const scheduleItems = rows.map(r => ({
    id: r.sched.id,
    eventId: r.sched.eventId,
    eventTitle: r.eventTitle ?? `이벤트 #${r.sched.eventId}`,
    eventStatus: r.eventStatus ?? "draft",
    zoneId: r.sched.zoneId,
    zoneName: r.zoneName ?? null,
    zoneType: r.zoneType ?? null,
    zoneColor: r.zoneColor ?? null,
    startDate: r.sched.startDate,
    endDate: r.sched.endDate,
    status: r.sched.status,
    notes: r.sched.notes ?? null,
    itemType: "schedule" as const,
  }));

  const eventItems = approvedEvents
    .filter(ev => !scheduleItems.some(s => s.eventId === ev.id))
    .map(ev => ({
      id: -(ev.id),
      eventId: ev.id,
      eventTitle: ev.title,
      eventStatus: ev.status,
      zoneId: null,
      zoneName: null,
      zoneType: null,
      zoneColor: null,
      startDate: ev.startDate,
      endDate: ev.endDate,
      status: ev.status,
      notes: null,
      itemType: "event" as const,
    }));

  return res.json([...scheduleItems, ...eventItems]);
});

router.get("/admin/settings", async (req, res) => {
  const settings = await db.select().from(systemSettingsTable);
  return res.json(settings.map(s => ({ key: s.key, value: s.value })));
});

router.put("/admin/settings/:key", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== "string") return res.status(400).json({ error: "value must be string" });

  const existing = await db.query.systemSettingsTable.findFirst({ where: eq(systemSettingsTable.key, key) });
  if (existing) {
    const [updated] = await db.update(systemSettingsTable).set({ value, updatedAt: new Date() }).where(eq(systemSettingsTable.key, key)).returning();
    return res.json({ key: updated.key, value: updated.value });
  } else {
    const [created] = await db.insert(systemSettingsTable).values({ key, value }).returning();
    return res.json({ key: created.key, value: created.value });
  }
});

router.get("/admin/users", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { organizationsTable } = await import("@workspace/db");
  const rows = await db.select({
    user: usersTable,
    orgName: organizationsTable.name,
    orgContactName: organizationsTable.contactName,
    orgContactPhone: organizationsTable.contactPhone,
    eventCount: sql<number>`CAST(COUNT(DISTINCT ${eventsTable.id}) AS INTEGER)`,
  })
    .from(usersTable)
    .leftJoin(organizationsTable, eq(usersTable.organizationId, organizationsTable.id))
    .leftJoin(eventsTable, eq(eventsTable.organizationId, organizationsTable.id))
    .groupBy(usersTable.id, organizationsTable.id, organizationsTable.name, organizationsTable.contactName, organizationsTable.contactPhone)
    .orderBy(asc(usersTable.createdAt));

  return res.json(rows.map(r => ({
    id: r.user.id,
    supabaseId: r.user.supabaseId,
    email: r.user.email,
    name: r.user.name ?? null,
    phone: r.user.phone ?? null,
    role: r.user.role,
    organizationId: r.user.organizationId ?? null,
    organizationName: r.orgName ?? null,
    contactName: r.orgContactName ?? null,
    contactPhone: r.orgContactPhone ?? null,
    eventCount: Number(r.eventCount ?? 0),
    createdAt: r.user.createdAt.toISOString(),
  })));
});

router.post("/admin/upload-pdf", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { base64, filename, mimeType } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: "base64 and filename required" });
  if (mimeType !== "application/pdf") return res.status(400).json({ error: "PDF only" });
  try {
    const { supabaseAdmin } = await import("../lib/supabase");
    const buffer = Buffer.from(base64 as string, "base64");
    const ext = String(filename).split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "pdf";
    const safeName = `guide_${Date.now()}.${ext}`;
    const path = `guides/${safeName}`;
    const { data, error } = await supabaseAdmin.storage
      .from("nodeul-assets")
      .upload(path, buffer, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    const publicUrl = supabaseAdmin.storage.from("nodeul-assets").getPublicUrl(data.path).data.publicUrl;
    return res.json({ url: publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

router.delete("/admin/users/bulk", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== "super_admin") return res.status(403).json({ error: "Forbidden" });
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ error: "userIds required" });
  const filtered = (userIds as number[]).filter((id: number) => id !== admin.id);
  if (filtered.length === 0) return res.status(400).json({ error: "삭제할 사용자가 없습니다." });
  await db.delete(usersTable).where(inArray(usersTable.id, filtered));
  return res.json({ deleted: filtered.length });
});

router.delete("/admin/users/:userId", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (admin.role !== "super_admin") return res.status(403).json({ error: "Forbidden" });
  const userId = Number(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });
  if (userId === admin.id) return res.status(400).json({ error: "자신의 계정은 삭제할 수 없습니다." });
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, userId)).returning();
  if (!deleted) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true });
});

router.patch("/admin/users/:userId/role", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const userId = Number(req.params.userId);
  const { role } = req.body;
  if (!["user", "admin", "super_admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const [updated] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, userId)).returning();
  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ id: updated.id, email: updated.email, role: updated.role });
});

export default router;

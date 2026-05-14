import { Router } from "express";
import { db, eventsTable, promotionRequestsTable, schedulesTable, commentsTable, promotionZonesTable, usersTable, systemSettingsTable } from "@workspace/db";
import { eq, sql, desc, asc, and, gte, lte } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

async function requireAdmin(req: any, res: any) {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) { res.status(403).json({ error: "Forbidden" }); return null; }
  return user;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
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

  return res.json({
    pendingApprovalCount: pendingRequests.length,
    revisionRequestCount: revisionRequests.length,
    todayScheduleCount: todaySchedRows.length,
    conflictCount: 0,
    newSubmissionsCount: newSubmissions.length,
    recentlyUpdatedCount: allEvents.length,
    unreadCommentsCount: allComments.length,
    statusBreakdown,
    recentEvents: allEvents.slice(0, 5).map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? null,
      status: ev.status,
      organizationId: ev.organizationId,
      organizationName: null,
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

// ─── Conflicts ─────────────────────────────────────────────────────────────────
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

// ─── Calendar ──────────────────────────────────────────────────────────────────
router.get("/admin/calendar", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const startDate = `${month}-01`;
  const lastDay = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db.select({
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
    ));

  return res.json(rows.map(r => ({
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
  })));
});

// ─── System Settings ───────────────────────────────────────────────────────────
router.get("/admin/settings", async (req, res) => {
  // Public read for NPC greeting (key: npc_greeting)
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

// ─── User Management ───────────────────────────────────────────────────────────
router.get("/admin/users", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const users = await db.select().from(usersTable).orderBy(asc(usersTable.createdAt));
  return res.json(users.map(u => ({
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    name: u.name ?? null,
    role: u.role,
    organizationId: u.organizationId ?? null,
    createdAt: u.createdAt.toISOString(),
  })));
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

import { Router } from "express";
import { db, eventsTable, promotionRequestsTable, schedulesTable, commentsTable, promotionZonesTable, usersTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

async function requireAdmin(req: any, res: any) {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
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

  const statusBreakdown = {
    draft: 0, submitted: 0, approved: 0, revision_requested: 0, rejected: 0, completed: 0,
  };
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

router.get("/admin/conflicts", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

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

export default router;

import { Router } from "express";
import { db, eventsTable, organizationsTable, promotionRequestsTable, promotionZonesTable, assetsTable, assetVersionsTable, schedulesTable, commentsTable, emailLogsTable } from "@workspace/db";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreateEventBody, UpdateEventBody } from "@workspace/api-zod";
import { usersTable } from "@workspace/db";

const router = Router();

async function getUser(supabaseId: string) {
  return db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, supabaseId) });
}

function formatEvent(ev: typeof eventsTable.$inferSelect, orgName?: string | null) {
  return {
    id: ev.id,
    title: ev.title,
    description: ev.description ?? null,
    status: ev.status,
    organizationId: ev.organizationId,
    organizationName: orgName ?? null,
    contactName: ev.contactName ?? null,
    contactEmail: ev.contactEmail ?? null,
    startDate: ev.startDate,
    endDate: ev.endDate,
    venue: ev.venue ?? null,
    tags: ev.tags ?? [],
    adminNote: ev.adminNote ?? null,
    createdAt: ev.createdAt.toISOString(),
    updatedAt: ev.updatedAt.toISOString(),
  };
}

router.get("/events", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const orgId = req.query.organizationId ? Number(req.query.organizationId) : undefined;

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  let query = db.select({
    event: eventsTable,
    orgName: organizationsTable.name,
  }).from(eventsTable)
    .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
    .$dynamic();

  const conditions = [];
  if (!isAdmin && user.organizationId) {
    conditions.push(eq(eventsTable.organizationId, user.organizationId));
  }
  if (status) conditions.push(eq(eventsTable.status, status));
  if (orgId) conditions.push(eq(eventsTable.organizationId, orgId));
  if (search) conditions.push(ilike(eventsTable.title, `%${search}%`));

  if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;

  const rows = await query.orderBy(desc(eventsTable.createdAt)).limit(limit).offset(offset);

  const total = await db.select({ count: sql<number>`count(*)` }).from(eventsTable)
    .then(r => Number(r[0].count));

  return res.json({
    events: rows.map(r => formatEvent(r.event, r.orgName)),
    total,
    page,
    limit,
  });
});

router.post("/events", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const orgId = user.organizationId;
  if (!orgId) return res.status(400).json({ error: "User has no organization. Create one first." });

  const [ev] = await db.insert(eventsTable).values({
    ...parsed.data,
    organizationId: orgId,
    createdBy: userId,
    status: "draft",
  }).returning();

  const org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, orgId) });
  return res.status(201).json(formatEvent(ev, org?.name));
});

router.get("/events/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const rows = await db.select({ event: eventsTable, orgName: organizationsTable.name })
    .from(eventsTable)
    .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
    .where(eq(eventsTable.id, id));

  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { event: ev, orgName } = rows[0];

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && ev.organizationId !== user.organizationId) return res.status(403).json({ error: "Forbidden" });

  const [promoRequests, assets, schedules, comments, emailLogs] = await Promise.all([
    db.select({ pr: promotionRequestsTable, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type })
      .from(promotionRequestsTable)
      .leftJoin(promotionZonesTable, eq(promotionRequestsTable.zoneId, promotionZonesTable.id))
      .where(eq(promotionRequestsTable.eventId, id)),
    db.select({ asset: assetsTable, zoneName: promotionZonesTable.name })
      .from(assetsTable)
      .leftJoin(promotionZonesTable, eq(assetsTable.zoneId, promotionZonesTable.id))
      .where(eq(assetsTable.eventId, id)),
    db.select({ sched: schedulesTable, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type, zoneColor: promotionZonesTable.color })
      .from(schedulesTable)
      .leftJoin(promotionZonesTable, eq(schedulesTable.zoneId, promotionZonesTable.id))
      .where(eq(schedulesTable.eventId, id)),
    db.select().from(commentsTable).where(and(eq(commentsTable.eventId, id), isAdmin ? sql`1=1` : eq(commentsTable.isAdminOnly, false))),
    db.select().from(emailLogsTable).where(eq(emailLogsTable.eventId, id)),
  ]);

  const assetIds = assets.map(a => a.asset.id);
  let versionMap: Record<number, { total: number; latestUrl: string | null; latestType: string | null }> = {};
  if (assetIds.length > 0) {
    for (const a of assets) {
      const versions = await db.select().from(assetVersionsTable)
        .where(eq(assetVersionsTable.assetId, a.asset.id))
        .orderBy(desc(assetVersionsTable.versionNumber));
      versionMap[a.asset.id] = {
        total: versions.length,
        latestUrl: versions[0]?.fileUrl ?? null,
        latestType: versions[0]?.fileType ?? null,
      };
    }
  }

  return res.json({
    ...formatEvent(ev, orgName),
    promotionRequests: promoRequests.map(r => ({
      id: r.pr.id,
      eventId: r.pr.eventId,
      zoneId: r.pr.zoneId,
      zoneName: r.zoneName ?? null,
      zoneType: r.zoneType ?? null,
      status: r.pr.status,
      requestedStartDate: r.pr.requestedStartDate,
      requestedEndDate: r.pr.requestedEndDate,
      notes: r.pr.notes ?? null,
      adminComment: r.pr.adminComment ?? null,
      createdAt: r.pr.createdAt.toISOString(),
      updatedAt: r.pr.updatedAt.toISOString(),
    })),
    assets: assets.map(a => ({
      id: a.asset.id,
      eventId: a.asset.eventId,
      name: a.asset.name,
      zoneId: a.asset.zoneId ?? null,
      zoneName: a.zoneName ?? null,
      currentVersion: versionMap[a.asset.id]?.total ?? 0,
      totalVersions: versionMap[a.asset.id]?.total ?? 0,
      selectedVersionId: a.asset.selectedVersionId ?? null,
      latestVersionUrl: versionMap[a.asset.id]?.latestUrl ?? null,
      latestVersionFileType: versionMap[a.asset.id]?.latestType ?? null,
      status: a.asset.status,
      createdAt: a.asset.createdAt.toISOString(),
      updatedAt: a.asset.updatedAt.toISOString(),
    })),
    schedules: schedules.map(s => ({
      id: s.sched.id,
      eventId: s.sched.eventId,
      eventTitle: ev.title,
      zoneId: s.sched.zoneId,
      zoneName: s.zoneName ?? null,
      zoneType: s.zoneType ?? null,
      zoneColor: s.zoneColor ?? null,
      startDate: s.sched.startDate,
      endDate: s.sched.endDate,
      status: s.sched.status,
      assetVersionId: s.sched.assetVersionId ?? null,
      notes: s.sched.notes ?? null,
      createdAt: s.sched.createdAt.toISOString(),
    })),
    comments: comments.map(c => ({
      id: c.id,
      eventId: c.eventId,
      content: c.content,
      authorName: c.authorName,
      authorRole: c.authorRole,
      isAdminOnly: c.isAdminOnly,
      createdAt: c.createdAt.toISOString(),
    })),
    emailLogs: emailLogs.map(e => ({
      id: e.id,
      eventId: e.eventId,
      emailType: e.emailType,
      recipientEmail: e.recipientEmail,
      subject: e.subject,
      status: e.status,
      sentAt: e.sentAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

router.patch("/events/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const existing = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, id) });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && existing.organizationId !== user.organizationId) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db.update(eventsTable).set(parsed.data).where(eq(eventsTable.id, id)).returning();
  const org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, updated.organizationId) });
  return res.json(formatEvent(updated, org?.name));
});

router.delete("/events/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const existing = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, id) });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && existing.organizationId !== user.organizationId) return res.status(403).json({ error: "Forbidden" });

  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  return res.status(204).send();
});

router.get("/events/:id/timeline", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  const comments = await db.select().from(commentsTable)
    .where(and(eq(commentsTable.eventId, id), isAdmin ? sql`1=1` : eq(commentsTable.isAdminOnly, false)))
    .orderBy(desc(commentsTable.createdAt));
  const emails = await db.select().from(emailLogsTable).where(eq(emailLogsTable.eventId, id)).orderBy(desc(emailLogsTable.createdAt));

  const timeline = [
    ...comments.map((c) => ({
      id: c.id * 100,
      eventId: c.eventId,
      type: "comment" as const,
      content: c.content,
      authorName: c.authorName,
      authorRole: c.authorRole,
      createdAt: c.createdAt.toISOString(),
    })),
    ...emails.map(e => ({
      id: e.id * 100 + 1,
      eventId: e.eventId,
      type: "email_sent" as const,
      content: `이메일 발송: ${e.subject} → ${e.recipientEmail}`,
      authorName: "시스템",
      authorRole: "admin",
      createdAt: e.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json(timeline);
});

export default router;

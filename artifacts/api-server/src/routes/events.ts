import { Router } from "express";
import { db, eventsTable, organizationsTable, promotionRequestsTable, promotionZonesTable, assetsTable, assetVersionsTable, schedulesTable, commentsTable, emailLogsTable } from "@workspace/db";
import { eq, and, ilike, desc, sql, inArray } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreateEventBody, UpdateEventBody } from "@workspace/api-zod";
import { usersTable } from "@workspace/db";

const router = Router();

async function getUser(supabaseId: string) {
  return db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, supabaseId) });
}

function formatEvent(ev: any, orgName?: string | null) {
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
    metadata: ev.metadata ? (() => { try { return JSON.parse(ev.metadata); } catch { return null; } })() : null,
    createdAt: ev.createdAt.toISOString(),
    updatedAt: ev.updatedAt.toISOString(),
  };
}

async function sendAdminNotificationEmail(eventId: number, eventTitle: string, submitterName: string | null) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping admin notification email");
    return;
  }
  const admins = await db.select().from(usersTable)
    .where(inArray(usersTable.role, ["admin", "super_admin"]));
  if (admins.length === 0) return;

  const appUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "https://nodeul-pr.replit.app";
  const subject = `[노들섬] 새 홍보 신청이 접수되었습니다: "${eventTitle}"`;
  const body = `안녕하세요,\n\n${submitterName ? `"${submitterName}"님이 ` : ""}새 행사 홍보 신청을 제출했습니다.\n\n행사명: ${eventTitle}\n\n아래 링크에서 신청 내용을 검토해 주세요:\n${appUrl}/admin/events/${eventId}`;

  // RESEND_TO_OVERRIDE: Resend 무료 계정은 계정 이메일로만 발송 가능
  // 도메인 인증 전까지 RESEND_TO_OVERRIDE 환경변수로 수신 이메일을 지정하세요
  const toOverride = process.env.RESEND_TO_OVERRIDE;

  for (const admin of admins) {
    if (!admin.email) continue;
    const toAddress = toOverride || admin.email;
    let status = "failed";
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "노들섬 홍보팀 <onboarding@resend.dev>",
          to: [toAddress],
          subject,
          html: `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:24px;border:2px solid #000;">
            <h2 style="font-family:'Courier New';color:#0a6b00;">🏝️ 노들섬 홍보 통합 시스템</h2>
            <h3 style="border-bottom:1px solid #000;padding-bottom:8px;">📬 새 홍보 신청 접수 알림</h3>
            <div style="background:#f8f0e3;border:1px solid #000;padding:16px;margin:16px 0;white-space:pre-wrap;">${body.replace(/\n/g, "<br>")}</div>
            <p style="font-size:12px;color:#666;">본 메일은 발송전용입니다. 문의사항은 <a href="mailto:nodeul@sfac.or.kr">nodeul@sfac.or.kr</a> 로 보내주시면 감사하겠습니다.</p>
          </div>`,
        }),
      });
      if (resp.ok) {
        status = "sent";
        console.log(`[email] Admin notification sent to ${toAddress} for event #${eventId}`);
      } else {
        const errBody = await resp.json().catch(() => ({}));
        console.error("[email] Resend API error in sendAdminNotificationEmail:", resp.status, errBody);
      }
    } catch (e) {
      console.error("[email] sendAdminNotificationEmail error:", e);
    }
    await db.insert(emailLogsTable).values({
      eventId, emailType: "submitted" as any, recipientEmail: admin.email, subject, body,
      status, sentAt: status === "sent" ? new Date() : null,
    }).catch(() => {});
  }
}

async function sendStatusChangeEmail(eventId: number, newStatus: string, createdBy: string | null, eventTitle: string) {
  if (!createdBy) return;
  const creator = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, createdBy) });
  if (!creator?.email) return;
  const subjects: Record<string, string> = {
    approved: `[노들섬] "${eventTitle}" 홍보 신청이 승인되었습니다`,
    revision_requested: `[노들섬] "${eventTitle}" 홍보 신청 수정이 요청되었습니다`,
    rejected: `[노들섬] "${eventTitle}" 홍보 신청이 반려되었습니다`,
  };
  const bodies: Record<string, string> = {
    approved: `안녕하세요,\n\n"${eventTitle}" 홍보 신청이 승인되었습니다.\n시스템에 접속하여 홍보물을 업로드해 주세요.\n\nhttps://nodeul-pr.replit.app`,
    revision_requested: `안녕하세요,\n\n"${eventTitle}" 홍보 신청에 대한 수정이 요청되었습니다.\n시스템에 접속하여 내용을 확인하고 파일을 재제출해 주세요.\n\nhttps://nodeul-pr.replit.app`,
    rejected: `안녕하세요,\n\n"${eventTitle}" 홍보 신청이 반려되었습니다.\n자세한 내용은 시스템에서 확인해 주세요.\n\nhttps://nodeul-pr.replit.app`,
  };
  const subject = subjects[newStatus];
  const body = bodies[newStatus];
  if (!subject) return;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  let status = "pending";
  try {
    if (RESEND_API_KEY) {
      const toOverride2 = process.env.RESEND_TO_OVERRIDE;
      const toAddress2 = toOverride2 || creator.email;
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "노들섬 홍보팀 <onboarding@resend.dev>",
          to: [toAddress2],
          subject,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px"><h2 style="color:#0a6b00">🏝️ 노들섬 홍보 통합 시스템</h2><div style="background:#f8f9fa;border-left:4px solid #0a6b00;padding:16px;margin:16px 0;white-space:pre-wrap">${body.replace(/\n/g,"<br>")}</div><p style="font-size:12px;color:#666">문의: <a href="mailto:nodeul@sfac.or.kr">nodeul@sfac.or.kr</a></p></div>`,
        }),
      });
      if (resp.ok) status = "sent";
      else {
        const errBody = await resp.json().catch(() => ({}));
        console.error("[email] Resend API error in sendStatusChangeEmail:", resp.status, errBody);
      }
    } else {
      console.warn("[email] RESEND_API_KEY not set — skipping auto status change email");
    }
  } catch { status = "failed"; }
  await db.insert(emailLogsTable).values({
    eventId, emailType: newStatus as any, recipientEmail: creator.email, subject, body,
    status, sentAt: status === "sent" ? new Date() : null,
  }).catch(() => {});
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
  if (!isAdmin) {
    conditions.push(eq(eventsTable.createdBy, userId));
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

  const { metadata: metaObj, ...rest } = parsed.data;
  const [ev] = await db.insert(eventsTable).values({
    ...rest,
    metadata: metaObj ? JSON.stringify(metaObj) : null,
    organizationId: orgId,
    createdBy: userId,
    status: "draft",
  }).returning();

  const org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, orgId) });
  return res.status(201).json(formatEvent(ev, org?.name));
});

router.get("/events/calendar", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const rows = await db.select({ event: eventsTable, orgName: organizationsTable.name })
    .from(eventsTable)
    .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id));
  return res.json(rows.map(r => {
    const isOwner = isAdmin || r.event.createdBy === userId;
    return {
      id: r.event.id,
      title: isOwner ? r.event.title : "예약됨",
      startDate: r.event.startDate,
      endDate: r.event.endDate,
      status: r.event.status,
      organizationName: isOwner ? (r.orgName ?? null) : null,
      isOwner,
    };
  }));
});

router.get("/events/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const rows = await db.select({
    event: eventsTable,
    orgName: organizationsTable.name,
    orgContactPhone: organizationsTable.contactPhone,
    orgContactTitle: organizationsTable.contactTitle,
    orgExtensionPhone: organizationsTable.extensionPhone,
  })
    .from(eventsTable)
    .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
    .where(eq(eventsTable.id, id));

  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { event: ev, orgName, orgContactPhone, orgContactTitle, orgExtensionPhone } = rows[0];

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && ev.createdBy !== userId) return res.status(403).json({ error: "Forbidden" });

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
    contactPhone: orgContactPhone ?? null,
    contactTitle: orgContactTitle ?? null,
    extensionPhone: orgExtensionPhone ?? null,
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
      parentId: c.parentId ?? null,
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
  if (!isAdmin && existing.createdBy !== userId) return res.status(403).json({ error: "Forbidden" });

  const { metadata: metaObj, ...rest } = parsed.data;
  const updateData: any = { ...rest };
  if (metaObj !== undefined) updateData.metadata = JSON.stringify(metaObj);
  const [updated] = await db.update(eventsTable).set(updateData).where(eq(eventsTable.id, id)).returning();
  const org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, updated.organizationId) });
  // Auto-send email when status changes
  if (parsed.data.status && parsed.data.status !== existing.status) {
    if (["approved", "revision_requested", "rejected"].includes(parsed.data.status)) {
      sendStatusChangeEmail(id, parsed.data.status, existing.createdBy, existing.title).catch(() => {});
    }
    if (parsed.data.status === "submitted") {
      const submitter = existing.createdBy
        ? await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, existing.createdBy) })
        : null;
      sendAdminNotificationEmail(id, existing.title, submitter?.name ?? null).catch(() => {});
    }
  }
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
  if (!isAdmin && existing.createdBy !== userId) return res.status(403).json({ error: "Forbidden" });

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

router.post("/events/:id/upload-asset", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const eventId = Number(req.params.id);
  const { base64, filename, mimeType } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: "base64 and filename required" });

  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const approxBytes = Math.ceil((base64 as string).length * 0.75);
  if (approxBytes > MAX_FILE_BYTES) return res.status(413).json({ error: "파일 크기는 5MB를 초과할 수 없습니다." });

  try {
    const { supabaseAdmin } = await import("../lib/supabase");
    const buffer = Buffer.from(base64 as string, "base64");
    const ext = String(filename).split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const safeName = `asset_${Date.now()}.${ext}`;
    const path = `events/${eventId}/${safeName}`;
    const { data, error } = await supabaseAdmin.storage
      .from("nodeul-assets")
      .upload(path, buffer, { contentType: mimeType || "application/octet-stream", upsert: true });
    if (error) throw error;
    const publicUrl = supabaseAdmin.storage.from("nodeul-assets").getPublicUrl(data.path).data.publicUrl;
    return res.json({ url: publicUrl, path: data.path });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

router.get("/events/:id/assets/zip", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const eventId = Number(req.params.id);
  const event = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, eventId) });
  if (!event) return res.status(404).json({ error: "Event not found" });

  const assets = await db.select().from(assetsTable).where(eq(assetsTable.eventId, eventId));
  const selectedAssets = assets.filter(a => a.selectedVersionId);
  if (selectedAssets.length === 0) return res.status(404).json({ error: "선택된 최종 파일이 없습니다." });

  const versionIds = selectedAssets.map(a => a.selectedVersionId!);
  const versions = await db.select().from(assetVersionsTable).where(
    versionIds.length === 1
      ? eq(assetVersionsTable.id, versionIds[0])
      : require("drizzle-orm").inArray(assetVersionsTable.id, versionIds)
  );

  const zipName = `assets_event_${eventId}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    await Promise.all(versions.map(async (v, idx) => {
      const fileName = v.fileName ?? `asset_${idx + 1}`;
      try {
        const response = await fetch(v.fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${v.fileUrl}`);
        const arrayBuffer = await response.arrayBuffer();
        zip.file(fileName, Buffer.from(arrayBuffer));
      } catch (e) {
        console.warn(`[zip] skipping ${fileName}:`, e);
      }
    }));
    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "ZIP 생성 실패" });
  }
});

export default router;

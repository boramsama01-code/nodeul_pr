import { Router } from "express";
import { db, promotionRequestsTable, promotionZonesTable, eventsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreatePromotionRequestBody, UpdatePromotionRequestBody, ApprovePromotionRequestBody } from "@workspace/api-zod";

async function sendRevisionEmail(recipientEmail: string, eventTitle: string, revisionNote: string | null) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("[sendRevisionEmail] RESEND_API_KEY not set — skipping email");
    return;
  }
  const noteText = revisionNote || "담당자에게 문의해 주세요.";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "노들섬 홍보팀 <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `[노들섬] 홍보 신청 수정 요청 — ${eventTitle}`,
        html: `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:20px;border:2px solid #000;">
          <h2 style="font-family:'Courier New';color:#0a6b00;">🏝️ 노들섬 홍보 통합 시스템</h2>
          <p>안녕하세요. <strong>${eventTitle}</strong> 홍보 신청에 대해 수정 요청이 접수되었습니다.</p>
          <div style="border:1px solid #000;padding:16px;background:#f8f0e3;white-space:pre-wrap;margin:16px 0;"><strong>수정 요청 내용:</strong><br><br>${noteText.replace(/\n/g, "<br>")}</div>
          <p>시스템에 로그인하여 수정 사항을 반영해 주시기 바랍니다.</p>
          <p style="font-size:12px;color:#666;margin-top:16px;">본 메일은 발송전용입니다. 문의사항은 <a href="mailto:nodeul@sfac.or.kr">nodeul@sfac.or.kr</a> 로 보내주시면 감사하겠습니다.</p>
        </div>`,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("[sendRevisionEmail] Resend error:", response.status, err);
    } else {
      console.info("[sendRevisionEmail] Email sent to", recipientEmail);
    }
  } catch (e) {
    console.error("[sendRevisionEmail] Failed to send email:", e);
  }
}

const router = Router();

async function getUser(supabaseId: string) {
  return db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, supabaseId) });
}

function formatRequest(pr: typeof promotionRequestsTable.$inferSelect, zoneName?: string | null, zoneType?: string | null) {
  return {
    id: pr.id,
    eventId: pr.eventId,
    zoneId: pr.zoneId,
    zoneName: zoneName ?? null,
    zoneType: zoneType ?? null,
    status: pr.status,
    requestedStartDate: pr.requestedStartDate,
    requestedEndDate: pr.requestedEndDate,
    notes: pr.notes ?? null,
    adminComment: pr.adminComment ?? null,
    createdAt: pr.createdAt.toISOString(),
    updatedAt: pr.updatedAt.toISOString(),
  };
}

router.get("/promotion-requests", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db.select({ pr: promotionRequestsTable, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type })
    .from(promotionRequestsTable)
    .leftJoin(promotionZonesTable, eq(promotionRequestsTable.zoneId, promotionZonesTable.id));

  return res.json(rows.map(r => formatRequest(r.pr, r.zoneName, r.zoneType)));
});

router.post("/promotion-requests", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreatePromotionRequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [pr] = await db.insert(promotionRequestsTable).values({ ...parsed.data, status: "pending" }).returning();
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, pr.zoneId) });
  return res.status(201).json(formatRequest(pr, zone?.name, zone?.type));
});

router.get("/promotion-requests/:id", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db.select({ pr: promotionRequestsTable, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type })
    .from(promotionRequestsTable)
    .leftJoin(promotionZonesTable, eq(promotionRequestsTable.zoneId, promotionZonesTable.id))
    .where(eq(promotionRequestsTable.id, id));

  if (!rows.length) return res.status(404).json({ error: "Not found" });
  return res.json(formatRequest(rows[0].pr, rows[0].zoneName, rows[0].zoneType));
});

router.patch("/promotion-requests/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdatePromotionRequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [updated] = await db.update(promotionRequestsTable).set(parsed.data).where(eq(promotionRequestsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, updated.zoneId) });
  return res.json(formatRequest(updated, zone?.name, zone?.type));
});

router.post("/promotion-requests/:id/approve", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const id = Number(req.params.id);
  const parsed = ApprovePromotionRequestBody.safeParse(req.body);

  const [updated] = await db.update(promotionRequestsTable)
    .set({ status: "approved", adminComment: parsed.success ? parsed.data.comment : null })
    .where(eq(promotionRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, updated.zoneId) });
  return res.json(formatRequest(updated, zone?.name, zone?.type));
});

router.post("/promotion-requests/:id/reject", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const id = Number(req.params.id);
  const parsed = ApprovePromotionRequestBody.safeParse(req.body);

  const [updated] = await db.update(promotionRequestsTable)
    .set({ status: "rejected", adminComment: parsed.success ? parsed.data.comment : null })
    .where(eq(promotionRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, updated.zoneId) });
  return res.json(formatRequest(updated, zone?.name, zone?.type));
});

router.post("/promotion-requests/:id/request-revision", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const id = Number(req.params.id);
  const parsed = ApprovePromotionRequestBody.safeParse(req.body);
  const adminComment = parsed.success ? parsed.data.comment : null;

  const [updated] = await db.update(promotionRequestsTable)
    .set({ status: "revision_requested", adminComment })
    .where(eq(promotionRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  const [zone, event] = await Promise.all([
    db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, updated.zoneId) }),
    db.query.eventsTable.findFirst({ where: eq(eventsTable.id, updated.eventId) }),
  ]);

  if (event?.contactEmail) {
    sendRevisionEmail(event.contactEmail, event.title, adminComment ?? null).catch((e) =>
      console.error("[request-revision] background email error:", e)
    );
  }

  return res.json(formatRequest(updated, zone?.name, zone?.type));
});

export default router;

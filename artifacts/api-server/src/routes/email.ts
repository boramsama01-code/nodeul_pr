import { Router } from "express";
import { db, emailLogsTable, eventsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { SendEventEmailBody } from "@workspace/api-zod";

const router = Router();

router.post("/events/:eventId/send-email", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const eventId = Number(req.params.eventId);
  const parsed = SendEventEmailBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const { emailType, recipientEmail, subject, body } = parsed.data;

  const footerNote = "\n\n---\n본 메일은 발송전용입니다. 문의사항은 nodeul@sfac.or.kr 로 보내주시면 감사하겠습니다.";
  const fullBody = body + footerNote;

  let emailStatus = "failed";
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "노들섬 홍보팀 <onboarding@resend.dev>",
          to: [recipientEmail],
          subject,
          html: `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:20px;border:2px solid #000;">
            <h2 style="font-family:'Courier New';color:#0a6b00;">🏝️ 노들섬 홍보 통합 시스템</h2>
            <div style="border:1px solid #000;padding:16px;background:#f8f0e3;white-space:pre-wrap;">${fullBody.replace(/\n/g, "<br>")}</div>
            <p style="font-size:12px;color:#666;margin-top:16px;">본 메일은 발송전용입니다. 문의사항은 <a href="mailto:nodeul@sfac.or.kr">nodeul@sfac.or.kr</a> 로 보내주시면 감사하겠습니다.</p>
          </div>`,
        }),
      });
      if (response.ok) emailStatus = "sent";
    } else {
      emailStatus = "sent";
    }
  } catch {
    emailStatus = "failed";
  }

  const [log] = await db.insert(emailLogsTable).values({
    eventId,
    emailType,
    recipientEmail,
    subject,
    body: fullBody,
    status: emailStatus,
    sentAt: emailStatus === "sent" ? new Date() : null,
  }).returning();

  return res.json({
    id: log.id,
    eventId: log.eventId,
    emailType: log.emailType,
    recipientEmail: log.recipientEmail,
    subject: log.subject,
    status: log.status,
    sentAt: log.sentAt?.toISOString() ?? null,
    createdAt: log.createdAt.toISOString(),
  });
});

router.get("/events/:eventId/email-logs", async (req, res) => {
  const eventId = Number(req.params.eventId);
  const logs = await db.select().from(emailLogsTable).where(eq(emailLogsTable.eventId, eventId));
  return res.json(logs.map(e => ({
    id: e.id,
    eventId: e.eventId,
    emailType: e.emailType,
    recipientEmail: e.recipientEmail,
    subject: e.subject,
    status: e.status,
    sentAt: e.sentAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;

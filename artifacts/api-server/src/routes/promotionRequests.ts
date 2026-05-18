import { Router } from "express";
import { db, promotionRequestsTable, promotionZonesTable, eventsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreatePromotionRequestBody, UpdatePromotionRequestBody, ApprovePromotionRequestBody } from "@workspace/api-zod";

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

  const [updated] = await db.update(promotionRequestsTable)
    .set({ status: "revision_requested", adminComment: parsed.success ? parsed.data.comment : null })
    .where(eq(promotionRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, updated.zoneId) });
  return res.json(formatRequest(updated, zone?.name, zone?.type));
});

export default router;

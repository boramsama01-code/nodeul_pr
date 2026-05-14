import { Router } from "express";
import { db, promotionZonesTable, schedulesTable, usersTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

function formatZone(z: typeof promotionZonesTable.$inferSelect) {
  return {
    id: z.id,
    name: z.name,
    type: z.type,
    description: z.description ?? null,
    isActive: z.isActive,
    color: z.color ?? null,
    requiresEndDate: z.requiresEndDate,
    requiresAssetUpload: z.requiresAssetUpload,
    allowMultipleFiles: z.allowMultipleFiles,
    sortOrder: z.sortOrder,
    maxConcurrent: z.maxConcurrent ?? null,
  };
}

async function requireAdmin(req: any, res: any) {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) { res.status(403).json({ error: "Forbidden" }); return null; }
  return user;
}

router.get("/promotion-zones", async (req, res) => {
  const zones = await db.select().from(promotionZonesTable).orderBy(asc(promotionZonesTable.sortOrder));
  return res.json(zones.map(formatZone));
});

router.post("/promotion-zones", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { name, type, description, color, requiresEndDate, requiresAssetUpload, allowMultipleFiles, sortOrder, maxConcurrent } = req.body;
  if (!name || !type) return res.status(400).json({ error: "name and type required" });

  const [zone] = await db.insert(promotionZonesTable).values({
    name,
    type,
    description: description ?? null,
    color: color ?? null,
    requiresEndDate: requiresEndDate ?? true,
    requiresAssetUpload: requiresAssetUpload ?? true,
    allowMultipleFiles: allowMultipleFiles ?? false,
    sortOrder: sortOrder ?? 0,
    maxConcurrent: maxConcurrent ?? null,
  }).returning();
  return res.status(201).json(formatZone(zone));
});

router.patch("/promotion-zones/:zoneId", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const zoneId = Number(req.params.zoneId);
  const { name, type, description, color, isActive, requiresEndDate, requiresAssetUpload, allowMultipleFiles, sortOrder, maxConcurrent } = req.body;

  const existing = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, zoneId) });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const updates: Partial<typeof promotionZonesTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (description !== undefined) updates.description = description;
  if (color !== undefined) updates.color = color;
  if (isActive !== undefined) updates.isActive = isActive;
  if (requiresEndDate !== undefined) updates.requiresEndDate = requiresEndDate;
  if (requiresAssetUpload !== undefined) updates.requiresAssetUpload = requiresAssetUpload;
  if (allowMultipleFiles !== undefined) updates.allowMultipleFiles = allowMultipleFiles;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (maxConcurrent !== undefined) updates.maxConcurrent = maxConcurrent === null ? null : Number(maxConcurrent);

  const [updated] = await db.update(promotionZonesTable).set(updates).where(eq(promotionZonesTable.id, zoneId)).returning();
  return res.json(formatZone(updated));
});

router.delete("/promotion-zones/:zoneId", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const zoneId = Number(req.params.zoneId);
  await db.delete(promotionZonesTable).where(eq(promotionZonesTable.id, zoneId));
  return res.json({ ok: true });
});

// ─── Availability check (maxConcurrent 적용) ─────────────────────────────────
router.get("/promotion-zones/availability", async (req, res) => {
  const zoneId = Number(req.query.zoneId);
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!zoneId || !startDate) return res.status(400).json({ error: "Missing required params" });

  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, zoneId) });
  if (!zone) return res.status(404).json({ error: "Zone not found" });

  // 종료일이 필요 없는 구역이면 startDate만 체크
  const effectiveEndDate = zone.requiresEndDate ? (endDate || startDate) : startDate;

  const existingSchedules = await db.select().from(schedulesTable)
    .where(and(eq(schedulesTable.zoneId, zoneId), eq(schedulesTable.status, "scheduled")));

  const overlapping = existingSchedules.filter(c =>
    c.startDate <= effectiveEndDate && c.endDate >= startDate
  );

  // maxConcurrent: null = 무제한, 숫자 = 그 숫자 초과하면 불가
  const maxConcurrent = zone.maxConcurrent ?? null;
  const isAvailable = maxConcurrent === null ? true : overlapping.length < maxConcurrent;

  return res.json({
    zoneId,
    startDate,
    endDate: effectiveEndDate,
    isAvailable,
    currentCount: overlapping.length,
    maxConcurrent,
    message: isAvailable ? null : "이미 등록된 일정이 있어 등록이 불가합니다.",
    conflicts: overlapping.map(c => ({
      zoneId,
      zoneName: zone.name,
      conflictingEventId: c.eventId,
      conflictingEventTitle: `이벤트 #${c.eventId}`,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
  });
});

export default router;

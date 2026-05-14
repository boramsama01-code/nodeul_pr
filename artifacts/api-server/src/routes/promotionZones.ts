import { Router } from "express";
import { db, promotionZonesTable, schedulesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { CreatePromotionZoneBody } from "@workspace/api-zod";
import { usersTable } from "@workspace/db";

const router = Router();

function formatZone(z: typeof promotionZonesTable.$inferSelect) {
  return { id: z.id, name: z.name, type: z.type, description: z.description ?? null, isActive: z.isActive, color: z.color ?? null };
}

router.get("/promotion-zones", async (req, res) => {
  const zones = await db.select().from(promotionZonesTable);
  return res.json(zones.map(formatZone));
});

router.post("/promotion-zones", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const parsed = CreatePromotionZoneBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [zone] = await db.insert(promotionZonesTable).values(parsed.data).returning();
  return res.status(201).json(formatZone(zone));
});

router.get("/promotion-zones/availability", async (req, res) => {
  const zoneId = Number(req.query.zoneId);
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!zoneId || !startDate || !endDate) return res.status(400).json({ error: "Missing required params" });

  const conflicts = await db.select({
    sched: schedulesTable,
  }).from(schedulesTable)
    .where(and(
      eq(schedulesTable.zoneId, zoneId),
      eq(schedulesTable.status, "scheduled"),
    ));

  const overlapping = conflicts.filter(c => {
    return c.sched.startDate <= endDate && c.sched.endDate >= startDate;
  });

  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, zoneId) });

  return res.json({
    zoneId,
    startDate,
    endDate,
    isAvailable: overlapping.length === 0,
    conflicts: overlapping.map(c => ({
      zoneId,
      zoneName: zone?.name ?? "",
      conflictingEventId: c.sched.eventId,
      conflictingEventTitle: `이벤트 #${c.sched.eventId}`,
      startDate: c.sched.startDate,
      endDate: c.sched.endDate,
    })),
  });
});

export default router;

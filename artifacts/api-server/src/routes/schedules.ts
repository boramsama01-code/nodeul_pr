import { Router } from "express";
import { db, schedulesTable, eventsTable, promotionZonesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreateScheduleBody, UpdateScheduleBody } from "@workspace/api-zod";

const router = Router();

function formatSchedule(s: typeof schedulesTable.$inferSelect, eventTitle?: string | null, zoneName?: string | null, zoneType?: string | null, zoneColor?: string | null) {
  return {
    id: s.id,
    eventId: s.eventId,
    eventTitle: eventTitle ?? null,
    zoneId: s.zoneId,
    zoneName: zoneName ?? null,
    zoneType: zoneType ?? null,
    zoneColor: zoneColor ?? null,
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status,
    assetVersionId: s.assetVersionId ?? null,
    notes: s.notes ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/schedules", async (req, res) => {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const zoneId = req.query.zoneId ? Number(req.query.zoneId) : undefined;
  const status = req.query.status as string | undefined;

  const rows = await db.select({ sched: schedulesTable, eventTitle: eventsTable.title, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type, zoneColor: promotionZonesTable.color })
    .from(schedulesTable)
    .leftJoin(eventsTable, eq(schedulesTable.eventId, eventsTable.id))
    .leftJoin(promotionZonesTable, eq(schedulesTable.zoneId, promotionZonesTable.id));

  const filtered = rows.filter(r => {
    if (zoneId && r.sched.zoneId !== zoneId) return false;
    if (status && r.sched.status !== status) return false;
    if (startDate && r.sched.endDate < startDate) return false;
    if (endDate && r.sched.startDate > endDate) return false;
    return true;
  });

  return res.json(filtered.map(r => formatSchedule(r.sched, r.eventTitle, r.zoneName, r.zoneType, r.zoneColor)));
});

router.post("/schedules", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateScheduleBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [sched] = await db.insert(schedulesTable).values({ ...parsed.data, status: "scheduled" }).returning();
  const ev = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, sched.eventId) });
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, sched.zoneId) });
  return res.status(201).json(formatSchedule(sched, ev?.title, zone?.name, zone?.type, zone?.color));
});

router.patch("/schedules/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const parsed = UpdateScheduleBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [updated] = await db.update(schedulesTable).set(parsed.data).where(eq(schedulesTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  const ev = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, updated.eventId) });
  const zone = await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, updated.zoneId) });
  return res.json(formatSchedule(updated, ev?.title, zone?.name, zone?.type, zone?.color));
});

router.delete("/schedules/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  await db.delete(schedulesTable).where(eq(schedulesTable.id, id));
  return res.status(204).send();
});

router.get("/schedules/today", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const rows = await db.select({ sched: schedulesTable, eventTitle: eventsTable.title, zoneName: promotionZonesTable.name, zoneType: promotionZonesTable.type, zoneColor: promotionZonesTable.color })
    .from(schedulesTable)
    .leftJoin(eventsTable, eq(schedulesTable.eventId, eventsTable.id))
    .leftJoin(promotionZonesTable, eq(schedulesTable.zoneId, promotionZonesTable.id));

  const todaySchedules = rows.filter(r => r.sched.startDate <= today && r.sched.endDate >= today);
  return res.json(todaySchedules.map(r => formatSchedule(r.sched, r.eventTitle, r.zoneName, r.zoneType, r.zoneColor)));
});

export default router;

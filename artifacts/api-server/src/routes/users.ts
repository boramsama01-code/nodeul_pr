import { Router } from "express";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";

const router = Router();

async function getOrCreateUser(supabaseId: string, email: string) {
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, supabaseId) });
  if (!user) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const role = Number(count) === 0 ? "super_admin" : "user";
    const [created] = await db.insert(usersTable).values({ supabaseId, email, role }).returning();
    user = created;
  }
  return user;
}

router.get("/users/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const email = (req as any).userEmail ?? "";
  const user = await getOrCreateUser(userId, email);

  let org = null;
  if (user.organizationId) {
    org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, user.organizationId) });
  }

  return res.json({
    id: user.id,
    supabaseId: user.supabaseId,
    email: user.email,
    name: user.name ?? null,
    phone: user.phone ?? null,
    role: user.role,
    organizationId: user.organizationId ?? null,
    organizationName: org?.name ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const email = (req as any).userEmail ?? "";
  const user = await getOrCreateUser(userId, email);

  const { name, phone } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  return res.json({
    id: updated.id,
    supabaseId: updated.supabaseId,
    email: updated.email,
    name: updated.name ?? null,
    phone: updated.phone ?? null,
    role: updated.role,
    organizationId: updated.organizationId ?? null,
    organizationName: null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;

import { Router } from "express";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { GetMeResponse, UpdateMeBody } from "@workspace/api-zod";

const router = Router();

async function getOrCreateUser(clerkId: string, email: string) {
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) {
    const [created] = await db.insert(usersTable).values({ clerkId, email, role: "user" }).returning();
    user = created;
  }
  return user;
}

router.get("/users/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const auth = getAuth(req);
  const email = (auth?.sessionClaims?.email as string) ?? "";
  const user = await getOrCreateUser(userId, email);

  let org = null;
  if (user.organizationId) {
    org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, user.organizationId) });
  }

  return res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name ?? null,
    phone: user.phone ?? null,
    role: user.role,
    organizationId: user.organizationId ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user) return res.status(404).json({ error: "User not found" });

  const [updated] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, user.id)).returning();
  return res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    email: updated.email,
    name: updated.name ?? null,
    phone: updated.phone ?? null,
    role: updated.role,
    organizationId: updated.organizationId ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;

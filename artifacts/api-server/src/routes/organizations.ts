import { Router } from "express";
import { db, organizationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreateOrganizationBody, UpdateOrganizationBody } from "@workspace/api-zod";

const router = Router();

function formatOrg(org: typeof organizationsTable.$inferSelect) {
  return {
    id: org.id,
    name: org.name,
    contactName: org.contactName ?? null,
    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone ?? null,
    createdAt: org.createdAt.toISOString(),
  };
}

router.get("/organizations", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, userId) });
  if (!user) return res.status(404).json({ error: "User not found" });

  let orgs;
  if (user.role === "admin" || user.role === "super_admin") {
    orgs = await db.select().from(organizationsTable);
  } else {
    if (!user.organizationId) return res.json([]);
    orgs = await db.select().from(organizationsTable).where(eq(organizationsTable.id, user.organizationId));
  }
  return res.json(orgs.map(formatOrg));
});

router.post("/organizations", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateOrganizationBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [org] = await db.insert(organizationsTable).values(parsed.data).returning();

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, userId) });
  if (user && !user.organizationId) {
    await db.update(usersTable).set({ organizationId: org.id }).where(eq(usersTable.id, user.id));
  }

  return res.status(201).json(formatOrg(org));
});

router.get("/organizations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const org = await db.query.organizationsTable.findFirst({ where: eq(organizationsTable.id, id) });
  if (!org) return res.status(404).json({ error: "Not found" });
  return res.json(formatOrg(org));
});

router.patch("/organizations/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const id = Number(req.params.id);
  const parsed = UpdateOrganizationBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [updated] = await db.update(organizationsTable).set(parsed.data).where(eq(organizationsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatOrg(updated));
});

export default router;

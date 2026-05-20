import { Router } from "express";
import { db, commentsTable, usersTable, eventsTable, organizationsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { CreateCommentBody } from "@workspace/api-zod";

const router = Router();

router.get("/events/:eventId/comments", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, userId) });
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const eventId = Number(req.params.eventId);
  const comments = await db.select().from(commentsTable)
    .where(isAdmin
      ? eq(commentsTable.eventId, eventId)
      : and(eq(commentsTable.eventId, eventId), eq(commentsTable.isAdminOnly, false))
    )
    .orderBy(commentsTable.createdAt);

  return res.json(comments.map(c => ({
    id: c.id,
    eventId: c.eventId,
    parentId: c.parentId ?? null,
    content: c.content,
    authorName: c.authorName,
    authorRole: c.authorRole,
    isAdminOnly: c.isAdminOnly,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/events/:eventId/comments", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, userId) });

  const eventId = Number(req.params.eventId);
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const parentId = (req.body as any).parentId ? Number((req.body as any).parentId) : null;

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  let authorName = user?.name ?? user?.email?.split("@")[0] ?? "사용자";
  if (!isAdmin && (!user?.name)) {
    const evRows = await db.select({ contactName: eventsTable.contactName, orgName: organizationsTable.name })
      .from(eventsTable)
      .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
      .where(eq(eventsTable.id, eventId));
    if (evRows.length > 0) {
      const { contactName, orgName } = evRows[0];
      if (contactName && orgName) authorName = `${orgName}(${contactName})`;
      else if (contactName) authorName = contactName;
      else if (orgName) authorName = orgName;
    }
  }

  const [comment] = await db.insert(commentsTable).values({
    eventId,
    parentId,
    content: parsed.data.content,
    authorName,
    authorRole: user?.role ?? "user",
    isAdminOnly: parsed.data.isAdminOnly ?? false,
  }).returning();

  return res.status(201).json({
    id: comment.id,
    eventId: comment.eventId,
    parentId: comment.parentId ?? null,
    content: comment.content,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    isAdminOnly: comment.isAdminOnly,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.delete("/events/:eventId/comments/:commentId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, userId) });
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const commentId = Number(req.params.commentId);
  const comment = await db.query.commentsTable.findFirst({ where: eq(commentsTable.id, commentId) });
  if (!comment) return res.status(404).json({ error: "Not found" });

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const isAuthor = comment.authorName === (user.name ?? "사용자");

  if (!isAdmin && !isAuthor) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  return res.status(204).send();
});

export default router;

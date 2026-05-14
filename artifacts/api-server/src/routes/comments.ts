import { Router } from "express";
import { db, commentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { CreateCommentBody } from "@workspace/api-zod";

const router = Router();

router.get("/events/:eventId/comments", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const eventId = Number(req.params.eventId);
  const comments = await db.select().from(commentsTable)
    .where(isAdmin
      ? eq(commentsTable.eventId, eventId)
      : and(eq(commentsTable.eventId, eventId), eq(commentsTable.isAdminOnly, false))
    );

  return res.json(comments.map(c => ({
    id: c.id,
    eventId: c.eventId,
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
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });

  const eventId = Number(req.params.eventId);
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const [comment] = await db.insert(commentsTable).values({
    eventId,
    content: parsed.data.content,
    authorName: user?.name ?? user?.email ?? "사용자",
    authorRole: user?.role ?? "user",
    isAdminOnly: parsed.data.isAdminOnly ?? false,
  }).returning();

  return res.status(201).json({
    id: comment.id,
    eventId: comment.eventId,
    content: comment.content,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    isAdminOnly: comment.isAdminOnly,
    createdAt: comment.createdAt.toISOString(),
  });
});

export default router;

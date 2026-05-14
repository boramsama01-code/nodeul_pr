import { Router } from "express";
import { db, assetsTable, assetVersionsTable, promotionZonesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { CreateAssetBody, SelectAssetVersionBody } from "@workspace/api-zod";

const router = Router();

async function getUser(clerkId: string) {
  return db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
}

function formatVersion(v: typeof assetVersionsTable.$inferSelect) {
  return {
    id: v.id,
    assetId: v.assetId,
    versionNumber: v.versionNumber,
    fileUrl: v.fileUrl,
    fileType: v.fileType,
    fileName: v.fileName ?? "",
    fileSize: v.fileSize ?? null,
    changeMemo: v.changeMemo ?? null,
    adminComment: v.adminComment ?? null,
    isSelected: v.isSelected,
    uploadedAt: v.uploadedAt.toISOString(),
  };
}

async function formatAsset(asset: typeof assetsTable.$inferSelect, versions: typeof assetVersionsTable.$inferSelect[], zoneName?: string | null) {
  const latest = versions[0];
  return {
    id: asset.id,
    eventId: asset.eventId,
    name: asset.name,
    zoneId: asset.zoneId ?? null,
    zoneName: zoneName ?? null,
    currentVersion: versions.length,
    totalVersions: versions.length,
    selectedVersionId: asset.selectedVersionId ?? null,
    latestVersionUrl: latest?.fileUrl ?? null,
    latestVersionFileType: latest?.fileType ?? null,
    status: asset.status,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

router.get("/events/:eventId/assets", async (req, res) => {
  const eventId = Number(req.params.eventId);
  const rows = await db.select({ asset: assetsTable, zoneName: promotionZonesTable.name })
    .from(assetsTable)
    .leftJoin(promotionZonesTable, eq(assetsTable.zoneId, promotionZonesTable.id))
    .where(eq(assetsTable.eventId, eventId));

  const result = await Promise.all(rows.map(async r => {
    const versions = await db.select().from(assetVersionsTable)
      .where(eq(assetVersionsTable.assetId, r.asset.id))
      .orderBy(desc(assetVersionsTable.versionNumber));
    return formatAsset(r.asset, versions, r.zoneName);
  }));

  return res.json(result);
});

router.post("/events/:eventId/assets", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const eventId = Number(req.params.eventId);
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const { name, zoneId, fileUrl, fileType, fileName, fileSize, changeMemo } = parsed.data;

  const [asset] = await db.insert(assetsTable).values({
    eventId,
    name,
    zoneId: zoneId ?? null,
    status: "pending_review",
  }).returning();

  const [version] = await db.insert(assetVersionsTable).values({
    assetId: asset.id,
    versionNumber: 1,
    fileUrl,
    fileType,
    fileName: fileName ?? null,
    fileSize: fileSize ?? null,
    changeMemo: changeMemo ?? null,
    isSelected: false,
  }).returning();

  const zone = zoneId ? await db.query.promotionZonesTable.findFirst({ where: eq(promotionZonesTable.id, zoneId) }) : null;
  return res.status(201).json(await formatAsset(asset, [version], zone?.name));
});

router.get("/assets/:id", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db.select({ asset: assetsTable, zoneName: promotionZonesTable.name })
    .from(assetsTable)
    .leftJoin(promotionZonesTable, eq(assetsTable.zoneId, promotionZonesTable.id))
    .where(eq(assetsTable.id, id));

  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { asset, zoneName } = rows[0];

  const versions = await db.select().from(assetVersionsTable)
    .where(eq(assetVersionsTable.assetId, id))
    .orderBy(desc(assetVersionsTable.versionNumber));

  return res.json({
    ...(await formatAsset(asset, versions, zoneName)),
    versions: versions.map(formatVersion),
  });
});

router.patch("/assets/:id/versions/:versionId/select", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return res.status(403).json({ error: "Forbidden" });

  const assetId = Number(req.params.id);
  const versionId = Number(req.params.versionId);
  const parsed = SelectAssetVersionBody.safeParse(req.body);

  await db.update(assetVersionsTable).set({ isSelected: false }).where(eq(assetVersionsTable.assetId, assetId));
  const [selected] = await db.update(assetVersionsTable)
    .set({ isSelected: true, adminComment: parsed.success ? parsed.data.adminComment : null })
    .where(eq(assetVersionsTable.id, versionId))
    .returning();

  if (!selected) return res.status(404).json({ error: "Not found" });
  await db.update(assetsTable).set({ selectedVersionId: versionId, status: "final_selected" }).where(eq(assetsTable.id, assetId));

  return res.json(formatVersion(selected));
});

export default router;

import { Router } from "express";
import { db, assetsTable, assetVersionsTable, promotionZonesTable, usersTable, eventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "../middlewares/supabaseAuthMiddleware";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

const BUCKET = "nodeul-assets";

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52428800,
  });
  if (error && !error.message.includes("already exists")) {
    console.warn("Storage bucket setup warning:", error.message);
  }
}
ensureBucket().catch(() => {});

async function getUser(supabaseId: string) {
  return db.query.usersTable.findFirst({ where: eq(usersTable.supabaseId, supabaseId) });
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

async function formatAsset(
  asset: typeof assetsTable.$inferSelect,
  versions: typeof assetVersionsTable.$inferSelect[],
  zoneName?: string | null
) {
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

// Signed upload URL for Supabase Storage
router.post("/assets/upload-url", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { path, contentType } = req.body;
  if (!path) return res.status(400).json({ error: "path required" });

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) return res.status(500).json({ error: error?.message || "Failed to create upload URL" });

  const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return res.json({ signedUrl: data.signedUrl, token: data.token, publicUrl, path });
});

// List assets for an event
router.get("/events/:eventId/assets", async (req, res) => {
  const eventId = Number(req.params.eventId);
  const rows = await db
    .select({ asset: assetsTable, zoneName: promotionZonesTable.name })
    .from(assetsTable)
    .leftJoin(promotionZonesTable, eq(assetsTable.zoneId, promotionZonesTable.id))
    .where(eq(assetsTable.eventId, eventId));

  const result = await Promise.all(
    rows.map(async (r) => {
      const versions = await db
        .select()
        .from(assetVersionsTable)
        .where(eq(assetVersionsTable.assetId, r.asset.id))
        .orderBy(desc(assetVersionsTable.versionNumber));
      return formatAsset(r.asset, versions, r.zoneName);
    })
  );
  return res.json(result);
});

// Create new asset with first version
router.post("/events/:eventId/assets", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const eventId = Number(req.params.eventId);
  const { name, zoneId, fileUrl, fileType, fileName, fileSize, changeMemo } = req.body;
  if (!name || !fileUrl || !fileType) return res.status(400).json({ error: "name, fileUrl, fileType required" });

  // Ownership check
  const event = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, eventId) });
  if (!event) return res.status(404).json({ error: "Event not found" });
  const assetUser = await getUser(userId);
  const isAssetAdmin = assetUser?.role === "admin" || assetUser?.role === "super_admin";
  if (!isAssetAdmin && event.createdBy !== userId) return res.status(403).json({ error: "Forbidden: Not your event" });

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

// Get single asset with all versions
router.get("/assets/:id", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({ asset: assetsTable, zoneName: promotionZonesTable.name })
    .from(assetsTable)
    .leftJoin(promotionZonesTable, eq(assetsTable.zoneId, promotionZonesTable.id))
    .where(eq(assetsTable.id, id));

  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const { asset, zoneName } = rows[0];

  const versions = await db
    .select()
    .from(assetVersionsTable)
    .where(eq(assetVersionsTable.assetId, id))
    .orderBy(desc(assetVersionsTable.versionNumber));

  return res.json({
    ...(await formatAsset(asset, versions, zoneName)),
    versions: versions.map(formatVersion),
  });
});

// Add a new version to existing asset
router.post("/assets/:id/versions", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const assetId = Number(req.params.id);
  const { fileUrl, fileType, fileName, fileSize, changeMemo } = req.body;
  if (!fileUrl || !fileType) return res.status(400).json({ error: "fileUrl, fileType required" });

  const existing = await db.query.assetsTable.findFirst({ where: eq(assetsTable.id, assetId) });
  if (!existing) return res.status(404).json({ error: "Asset not found" });

  const latestVersions = await db
    .select()
    .from(assetVersionsTable)
    .where(eq(assetVersionsTable.assetId, assetId))
    .orderBy(desc(assetVersionsTable.versionNumber))
    .limit(1);

  const nextVersion = (latestVersions[0]?.versionNumber ?? 0) + 1;

  const [version] = await db.insert(assetVersionsTable).values({
    assetId,
    versionNumber: nextVersion,
    fileUrl,
    fileType,
    fileName: fileName ?? null,
    fileSize: fileSize ?? null,
    changeMemo: changeMemo ?? null,
    isSelected: false,
  }).returning();

  await db.update(assetsTable)
    .set({ status: "pending_review", updatedAt: new Date() })
    .where(eq(assetsTable.id, assetId));

  return res.status(201).json(formatVersion(version));
});

// Select final version (admin only)
router.patch("/assets/:id/versions/:versionId/select", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await getUser(userId);
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const assetId = Number(req.params.id);
  const versionId = Number(req.params.versionId);
  const { adminComment } = req.body;

  await db.update(assetVersionsTable).set({ isSelected: false }).where(eq(assetVersionsTable.assetId, assetId));
  const [selected] = await db
    .update(assetVersionsTable)
    .set({ isSelected: true, adminComment: adminComment ?? null })
    .where(eq(assetVersionsTable.id, versionId))
    .returning();

  if (!selected) return res.status(404).json({ error: "Not found" });

  await db
    .update(assetsTable)
    .set({ selectedVersionId: versionId, status: "final_selected", updatedAt: new Date() })
    .where(eq(assetsTable.id, assetId));

  return res.json(formatVersion(selected));
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { appsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/apps", async (req, res) => {
  const includeRemoved = req.query.includeRemoved === "true";
  const category = req.query.category as string | undefined;
  const interestTag = req.query.interestTag as string | undefined;

  let apps = await db.select().from(appsTable).orderBy(appsTable.name);

  if (!includeRemoved) {
    apps = apps.filter((a) => a.status !== "Removed");
  }
  if (category) {
    apps = apps.filter((a) => a.category === category);
  }
  if (interestTag) {
    apps = apps.filter((a) => a.interestTags.includes(interestTag));
  }

  return res.json(apps);
});

router.post("/apps", async (req, res) => {
  const body = req.body;
  const [app] = await db.insert(appsTable).values({
    name: body.name,
    appStoreUrl: body.appStoreUrl,
    category: body.category,
    ageMin: body.ageMin,
    ageMax: body.ageMax,
    interestTags: body.interestTags ?? [],
    costModel: body.costModel,
    adStatus: body.adStatus,
    notes: body.notes ?? "",
    status: body.status ?? "Active",
    lastVerified: new Date().toISOString().split("T")[0],
  }).returning();
  return res.status(201).json(app);
});

router.get("/apps/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, id));
  if (!app) return res.status(404).json({ error: "Not found" });
  return res.json(app);
});

router.put("/apps/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  const [app] = await db
    .update(appsTable)
    .set({
      name: body.name,
      appStoreUrl: body.appStoreUrl,
      category: body.category,
      ageMin: body.ageMin,
      ageMax: body.ageMax,
      interestTags: body.interestTags ?? [],
      costModel: body.costModel,
      adStatus: body.adStatus,
      notes: body.notes ?? "",
      status: body.status ?? "Active",
      lastVerified: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(eq(appsTable.id, id))
    .returning();
  if (!app) return res.status(404).json({ error: "Not found" });
  return res.json(app);
});

router.delete("/apps/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [app] = await db.delete(appsTable).where(eq(appsTable.id, id)).returning();
  if (!app) return res.status(404).json({ error: "Not found" });
  return res.json({ success: true });
});

export default router;

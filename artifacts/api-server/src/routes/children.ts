import { Router } from "express";
import { db } from "@workspace/db";
import { childrenTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/children", async (_req, res) => {
  const children = await db.select().from(childrenTable).orderBy(childrenTable.id);
  res.json(children);
});

router.post("/children", async (req, res) => {
  const body = req.body;
  const [child] = await db.insert(childrenTable).values({
    name: body.name,
    age: body.age,
    interests: body.interests ?? [],
    deviceName: body.deviceName,
    screenTimeWeekday: body.screenTimeWeekday ?? 0,
    screenTimeWeekend: body.screenTimeWeekend ?? 0,
    appleArcade: body.appleArcade ?? false,
  }).returning();
  res.status(201).json(child);
});

router.get("/children/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, id));
  if (!child) return res.status(404).json({ error: "Not found" });
  res.json(child);
});

router.put("/children/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  const [child] = await db
    .update(childrenTable)
    .set({
      name: body.name,
      age: body.age,
      interests: body.interests ?? [],
      deviceName: body.deviceName,
      screenTimeWeekday: body.screenTimeWeekday ?? 0,
      screenTimeWeekend: body.screenTimeWeekend ?? 0,
      appleArcade: body.appleArcade ?? false,
      updatedAt: new Date(),
    })
    .where(eq(childrenTable.id, id))
    .returning();
  if (!child) return res.status(404).json({ error: "Not found" });
  res.json(child);
});

export default router;

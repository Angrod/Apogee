import { Router } from "express";
import { db, childrenTable } from "@workspace/db";
import { CreateChildBody, GetChildParams, UpdateChildBody, UpdateChildParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { notFound, parse } from "../lib/http";

const router = Router();

router.get("/children", async (_req, res) => {
  const children = await db.select().from(childrenTable).orderBy(childrenTable.id);
  res.json(children);
});

router.post("/children", async (req, res) => {
  const body = parse(CreateChildBody, req.body);
  const [child] = await db.insert(childrenTable).values(body).returning();
  res.status(201).json(child);
});

router.get("/children/:id", async (req, res) => {
  const { id } = parse(GetChildParams, req.params);
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, id));
  if (!child) throw notFound("Child");
  res.json(child);
});

// Full replacement: the body must contain every field, so nothing is silently reset.
router.put("/children/:id", async (req, res) => {
  const { id } = parse(UpdateChildParams, req.params);
  const body = parse(UpdateChildBody, req.body);
  const [child] = await db
    .update(childrenTable)
    .set(body)
    .where(eq(childrenTable.id, id))
    .returning();
  if (!child) throw notFound("Child");
  res.json(child);
});

export default router;

import { Router } from "express";
import { db, appsTable } from "@workspace/db";
import {
  CreateAppBody,
  GetAppParams,
  ListAppsQueryParams,
  UpdateAppBody,
  UpdateAppParams,
} from "@workspace/api-zod";
import { and, arrayContains, eq, ne, type SQL } from "drizzle-orm";
import { badRequest, notFound, parse } from "../lib/http";

const router = Router();

const today = () => new Date().toISOString().split("T")[0];

function assertAgeRange(body: { ageMin: number; ageMax: number }) {
  if (body.ageMin > body.ageMax) {
    throw badRequest("Invalid request", ["ageMax: must be greater than or equal to ageMin"]);
  }
}

router.get("/apps", async (req, res) => {
  const { category, interestTag } = parse(ListAppsQueryParams, req.query);
  // Not taken from the parsed query: z.coerce.boolean() turns the string "false" into true.
  const includeRemoved = req.query.includeRemoved === "true";

  const filters: SQL[] = [];
  if (!includeRemoved) filters.push(ne(appsTable.status, "Removed"));
  if (category) filters.push(eq(appsTable.category, category));
  if (interestTag) filters.push(arrayContains(appsTable.interestTags, [interestTag]));

  const apps = await db
    .select()
    .from(appsTable)
    .where(and(...filters))
    .orderBy(appsTable.name);
  res.json(apps);
});

router.post("/apps", async (req, res) => {
  const body = parse(CreateAppBody, req.body);
  assertAgeRange(body);
  const [app] = await db
    .insert(appsTable)
    .values({ ...body, lastVerified: today() })
    .returning();
  res.status(201).json(app);
});

router.get("/apps/:id", async (req, res) => {
  const { id } = parse(GetAppParams, req.params);
  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, id));
  if (!app) throw notFound("App");
  res.json(app);
});

// Full replacement: the body must contain every field, so nothing is silently reset.
// Catalog removal is a soft delete through `status`; there is no DELETE endpoint.
router.put("/apps/:id", async (req, res) => {
  const { id } = parse(UpdateAppParams, req.params);
  const body = parse(UpdateAppBody, req.body);
  assertAgeRange(body);
  const [app] = await db
    .update(appsTable)
    .set({ ...body, lastVerified: today(), updatedAt: new Date() })
    .where(eq(appsTable.id, id))
    .returning();
  if (!app) throw notFound("App");
  res.json(app);
});

export default router;

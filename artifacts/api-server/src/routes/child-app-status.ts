import { Router } from "express";
import { db, childAppStatusTable } from "@workspace/db";
import { UpdateChildAppStatusBody, UpdateChildAppStatusParams } from "@workspace/api-zod";
import { isForeignKeyViolation, notFound, parse } from "../lib/http";

const router = Router();

// Single-statement upsert on the (child_id, app_id) unique index, so two
// simultaneous first writes can't collide.
router.put("/child-app-status/:childId/:appId", async (req, res) => {
  const { childId, appId } = parse(UpdateChildAppStatusParams, req.params);
  const { status } = parse(UpdateChildAppStatusBody, req.body);

  try {
    const [record] = await db
      .insert(childAppStatusTable)
      .values({ childId, appId, status })
      .onConflictDoUpdate({
        target: [childAppStatusTable.childId, childAppStatusTable.appId],
        set: { status, updatedAt: new Date() },
      })
      .returning();
    res.json(record);
  } catch (err) {
    if (isForeignKeyViolation(err)) throw notFound("Child or app");
    throw err;
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { childAppStatusTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.put("/child-app-status/:childId/:appId", async (req, res) => {
  const childId = parseInt(req.params.childId, 10);
  const appId = parseInt(req.params.appId, 10);
  const { status } = req.body;

  const [existing] = await db
    .select()
    .from(childAppStatusTable)
    .where(
      and(
        eq(childAppStatusTable.childId, childId),
        eq(childAppStatusTable.appId, appId)
      )
    );

  let record;
  if (existing) {
    [record] = await db
      .update(childAppStatusTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(childAppStatusTable.id, existing.id))
      .returning();
  } else {
    [record] = await db
      .insert(childAppStatusTable)
      .values({ childId, appId, status })
      .returning();
  }

  res.json(record);
});

export default router;

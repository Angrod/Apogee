import { Router } from "express";
import { db } from "@workspace/db";
import { childrenTable, appsTable, childAppStatusTable } from "@workspace/db";

const router = Router();

router.get("/export", async (_req, res) => {
  const [children, apps, childAppStatuses] = await Promise.all([
    db.select().from(childrenTable).orderBy(childrenTable.id),
    db.select().from(appsTable).orderBy(appsTable.id),
    db.select().from(childAppStatusTable).orderBy(childAppStatusTable.id),
  ]);
  res.json({ children, apps, childAppStatuses });
});

export default router;

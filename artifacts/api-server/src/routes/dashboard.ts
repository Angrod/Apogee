import { Router } from "express";
import { db, childrenTable, appsTable, childAppStatusTable, eq } from "@workspace/db";
import { appMatchesChild } from "../lib/matching";

const router = Router();

// Note: this GET also writes. It creates a "Not Installed" status row for any
// matched child/app pair that doesn't have one yet.
router.get("/dashboard", async (_req, res) => {
  const [children, apps, statuses] = await Promise.all([
    db.select().from(childrenTable).orderBy(childrenTable.id),
    db.select().from(appsTable).where(eq(appsTable.status, "Active")).orderBy(appsTable.name),
    db.select().from(childAppStatusTable),
  ]);

  const key = (childId: number, appId: number) => `${childId}-${appId}`;
  const statusIndex = new Map(statuses.map((s) => [key(s.childId, s.appId), s.status]));

  const matches = children.map((child) => ({
    child,
    apps: apps.filter((app) => appMatchesChild(app, child)),
  }));

  const missing = matches.flatMap(({ child, apps }) =>
    apps
      .filter((app) => !statusIndex.has(key(child.id, app.id)))
      .map((app) => ({ childId: child.id, appId: app.id, status: "Not Installed" as const })),
  );

  if (missing.length > 0) {
    const inserted = await db
      .insert(childAppStatusTable)
      .values(missing)
      .onConflictDoNothing()
      .returning();
    for (const row of inserted) statusIndex.set(key(row.childId, row.appId), row.status);
  }

  res.json(
    matches.map(({ child, apps }) => ({
      child,
      matchedApps: apps.map((app) => ({
        app,
        childStatus: statusIndex.get(key(child.id, app.id)) ?? "Not Installed",
      })),
    })),
  );
});

export default router;

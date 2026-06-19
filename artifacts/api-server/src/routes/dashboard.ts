import { Router } from "express";
import { db } from "@workspace/db";
import { childrenTable, appsTable, childAppStatusTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (_req, res) => {
  const [children, apps, statuses] = await Promise.all([
    db.select().from(childrenTable).orderBy(childrenTable.name),
    db.select().from(appsTable).where(eq(appsTable.status, "Active")).orderBy(appsTable.name),
    db.select().from(childAppStatusTable),
  ]);

  const statusIndex = new Map(
    statuses.map((s) => [`${s.childId}-${s.appId}`, s.status])
  );

  const matchedPairs: { childId: number; appId: number }[] = [];

  for (const child of children) {
    for (const app of apps) {
      if (app.ageMin > child.age || app.ageMax < child.age) continue;
      const hasSharedTag = app.interestTags.some((tag) =>
        (child.interests as string[]).includes(tag)
      );
      if (!hasSharedTag) continue;
      matchedPairs.push({ childId: child.id, appId: app.id });
    }
  }

  const missingPairs = matchedPairs.filter(
    ({ childId, appId }) => !statusIndex.has(`${childId}-${appId}`)
  );

  if (missingPairs.length > 0) {
    const inserted = await db
      .insert(childAppStatusTable)
      .values(
        missingPairs.map(({ childId, appId }) => ({
          childId,
          appId,
          status: "Not Installed" as const,
        }))
      )
      .onConflictDoNothing()
      .returning();

    for (const row of inserted) {
      statusIndex.set(`${row.childId}-${row.appId}`, row.status);
    }
  }

  const result = children.map((child) => {
    const matchedApps = apps
      .filter((app) => {
        if (app.ageMin > child.age || app.ageMax < child.age) return false;
        return app.interestTags.some((tag) =>
          (child.interests as string[]).includes(tag)
        );
      })
      .map((app) => ({
        app: {
          id: app.id,
          name: app.name,
          appStoreUrl: app.appStoreUrl,
          category: app.category,
          ageMin: app.ageMin,
          ageMax: app.ageMax,
          interestTags: app.interestTags,
          costModel: app.costModel,
          adStatus: app.adStatus,
          notes: app.notes,
          lastVerified: String(app.lastVerified),
          status: app.status,
          createdAt: app.createdAt.toISOString(),
          updatedAt: app.updatedAt.toISOString(),
        },
        childStatus: statusIndex.get(`${child.id}-${app.id}`) ?? "Not Installed",
      }));

    return {
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        interests: child.interests,
        deviceName: child.deviceName,
        screenTimeWeekday: child.screenTimeWeekday,
        screenTimeWeekend: child.screenTimeWeekend,
        appleArcade: child.appleArcade,
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString(),
      },
      matchedApps,
    };
  });

  res.json(result);
});

export default router;

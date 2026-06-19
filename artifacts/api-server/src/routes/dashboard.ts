import { Router } from "express";
import { db } from "@workspace/db";
import { childrenTable, appsTable, childAppStatusTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (_req, res) => {
  const [children, apps, statuses] = await Promise.all([
    db.select().from(childrenTable).orderBy(childrenTable.name),
    db.select().from(appsTable).where(eq(appsTable.status, "Active")).orderBy(appsTable.name),
    db.select().from(childAppStatusTable),
  ]);

  const result = children.map((child) => {
    const matchedApps = apps
      .filter((app) => {
        if (app.ageMin > child.age || app.ageMax < child.age) return false;
        const hasSharedTag = app.interestTags.some((tag) =>
          (child.interests as string[]).includes(tag)
        );
        return hasSharedTag;
      })
      .map((app) => {
        const statusRecord = statuses.find(
          (s) => s.childId === child.id && s.appId === app.id
        );
        return {
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
          childStatus: statusRecord?.status ?? "Not Installed",
        };
      });

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

import { pgTable, serial, integer, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { childrenTable } from "./children";
import { appsTable } from "./apps";

export const childAppStatusEnum = pgEnum("child_app_status_enum", [
  "Installed",
  "Not Installed",
  "Blocked",
  "Limited",
  "Pushed",
  "Removed",
]);

export const childAppStatusTable = pgTable(
  "child_app_status",
  {
    id: serial("id").primaryKey(),
    childId: integer("child_id")
      .notNull()
      .references(() => childrenTable.id),
    appId: integer("app_id")
      .notNull()
      .references(() => appsTable.id),
    status: childAppStatusEnum("status").notNull().default("Not Installed"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("child_app_status_child_id_app_id_unique").on(
      table.childId,
      table.appId
    ),
  ]
);

export type ChildAppStatus = typeof childAppStatusTable.$inferSelect;

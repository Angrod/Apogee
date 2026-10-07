import { pgTable, serial, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { childrenTable } from "./children";
import { appsTable } from "./apps";
import { installStatusEnum } from "./enums";

// One row per child/app pair: the same catalog app can be Installed for one
// sibling and Not Installed for another.
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
    status: installStatusEnum("status").notNull().default("Not Installed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("child_app_status_child_id_app_id_unique").on(t.childId, t.appId),
    index("child_app_status_app_id_idx").on(t.appId),
  ],
);

export type ChildAppStatus = typeof childAppStatusTable.$inferSelect;

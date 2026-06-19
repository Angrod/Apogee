import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { childrenTable } from "./children";
import { appsTable } from "./apps";

export const childAppStatusTable = pgTable("child_app_status", {
  id: serial("id").primaryKey(),
  childId: integer("child_id")
    .notNull()
    .references(() => childrenTable.id),
  appId: integer("app_id")
    .notNull()
    .references(() => appsTable.id),
  status: text("status").notNull().default("Not Installed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChildAppStatusSchema = createInsertSchema(childAppStatusTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChildAppStatus = z.infer<typeof insertChildAppStatusSchema>;
export type ChildAppStatus = typeof childAppStatusTable.$inferSelect;

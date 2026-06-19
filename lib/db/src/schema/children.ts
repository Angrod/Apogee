import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  interests: text("interests").array().notNull().default([]),
  deviceName: text("device_name").notNull(),
  screenTimeWeekday: integer("screen_time_weekday").notNull().default(0),
  screenTimeWeekend: integer("screen_time_weekend").notNull().default(0),
  appleArcade: boolean("apple_arcade").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;

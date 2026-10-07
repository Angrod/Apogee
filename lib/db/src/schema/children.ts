import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  interests: jsonb("interests").notNull().default([]).$type<string[]>(),
  deviceName: text("device_name").notNull(),
  screenTimeWeekday: integer("screen_time_weekday").notNull().default(0),
  screenTimeWeekend: integer("screen_time_weekend").notNull().default(0),
  appleArcade: boolean("apple_arcade").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Child = typeof childrenTable.$inferSelect;

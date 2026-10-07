import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, check } from "drizzle-orm/pg-core";
import { interestTagEnum } from "./enums";

export const childrenTable = pgTable(
  "children",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    interests: interestTagEnum("interests").array().notNull().default([]),
    deviceName: text("device_name").notNull(),
    // Minutes per day; the UI edits hours.
    screenTimeWeekday: integer("screen_time_weekday").notNull().default(0),
    screenTimeWeekend: integer("screen_time_weekend").notNull().default(0),
    appleArcade: boolean("apple_arcade").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("children_age_range", sql`${t.age} between 1 and 17`),
    check("children_screen_time_weekday_range", sql`${t.screenTimeWeekday} between 0 and 1440`),
    check("children_screen_time_weekend_range", sql`${t.screenTimeWeekend} between 0 and 1440`),
  ],
);

export type Child = typeof childrenTable.$inferSelect;

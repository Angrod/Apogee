import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp, date, check } from "drizzle-orm/pg-core";
import {
  adStatusEnum,
  catalogStatusEnum,
  categoryEnum,
  costModelEnum,
  interestTagEnum,
} from "./enums";

export const appsTable = pgTable(
  "apps",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    appStoreUrl: text("app_store_url").notNull(),
    category: categoryEnum("category").notNull(),
    ageMin: integer("age_min").notNull(),
    ageMax: integer("age_max").notNull(),
    interestTags: interestTagEnum("interest_tags").array().notNull().default([]),
    costModel: costModelEnum("cost_model").notNull(),
    adStatus: adStatusEnum("ad_status").notNull(),
    notes: text("notes").notNull().default(""),
    // Set to today on every create/update by the API (a save date, not an audit).
    lastVerified: date("last_verified").notNull().defaultNow(),
    status: catalogStatusEnum("status").notNull().default("Active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("apps_age_range", sql`${t.ageMin} between 0 and 17 and ${t.ageMax} between 0 and 17`),
    check("apps_age_order", sql`${t.ageMin} <= ${t.ageMax}`),
  ],
);

export type App = typeof appsTable.$inferSelect;

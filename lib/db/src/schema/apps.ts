import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";

export const appsTable = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  appStoreUrl: text("app_store_url").notNull(),
  category: text("category").notNull(),
  ageMin: integer("age_min").notNull(),
  ageMax: integer("age_max").notNull(),
  interestTags: text("interest_tags").array().notNull().default([]),
  costModel: text("cost_model").notNull(),
  adStatus: text("ad_status").notNull(),
  notes: text("notes").notNull().default(""),
  lastVerified: date("last_verified").notNull().defaultNow(),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type App = typeof appsTable.$inferSelect;

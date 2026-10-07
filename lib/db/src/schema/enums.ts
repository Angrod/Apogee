import { pgEnum } from "drizzle-orm/pg-core";

// These mirror the enums in lib/api-spec/openapi.yaml. The API server has a
// compile-time check (artifacts/api-server/src/lib/contract.ts) that fails if
// the two lists drift apart.

export const interestTagEnum = pgEnum("interest_tag", [
  "Engineering",
  "Baking/Food",
  "Music",
  "Drawing",
  "Reading",
  "Math",
  "Science",
  "Gaming",
  "Language Learning",
]);

export const categoryEnum = pgEnum("category", ["Games", "Education", "Creative", "Music", "Reading"]);

export const costModelEnum = pgEnum("cost_model", ["Free", "One-time purchase", "Subscription"]);

export const adStatusEnum = pgEnum("ad_status", ["No Ads", "Minimal", "Has Ads"]);

// Catalog soft delete: Removed apps keep their record and notes.
export const catalogStatusEnum = pgEnum("catalog_status", ["Active", "Removed"]);

// Per-child install state, tracked by the parent. Apogee does not install anything.
export const installStatusEnum = pgEnum("install_status", [
  "Not Installed",
  "Pushed",
  "Installed",
  "Removed",
]);

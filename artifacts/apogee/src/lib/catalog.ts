import {
  AdStatus,
  CatalogStatus,
  Category,
  CostModel,
  InstallStatus,
  InterestTag,
} from "@workspace/api-client-react";

// Option lists come from the enums generated from openapi.yaml, so the
// server, the forms, and the filters can't drift apart.
const values = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const INTEREST_TAGS = values(InterestTag);
export const CATEGORIES = values(Category);
export const COST_MODELS = values(CostModel);
export const AD_STATUSES = values(AdStatus);
export const CATALOG_STATUSES = values(CatalogStatus);
export const INSTALL_STATUSES = values(InstallStatus);

export function categoryColor(category: string) {
  switch (category) {
    case "Games": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Education": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Creative": return "bg-pink-100 text-pink-800 border-pink-200";
    case "Music": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Reading": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default: return "bg-stone-100 text-stone-700 border-stone-200";
  }
}

export function costColor(cost: string) {
  if (cost === "Free") return "bg-green-100 text-green-800 border-green-200";
  if (cost === "Subscription") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-sky-100 text-sky-800 border-sky-200";
}

export function adColor(ad: string) {
  if (ad === "No Ads") return "bg-green-100 text-green-800 border-green-200";
  if (ad === "Has Ads") return "bg-red-100 text-red-800 border-red-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

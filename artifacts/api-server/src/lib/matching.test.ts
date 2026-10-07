import { describe, expect, it } from "vitest";
import type { App, Child } from "@workspace/db";
import { appMatchesChild } from "./matching";

const now = new Date();
const child = (o: Partial<Child> = {}): Child => ({
  id: 1, name: "C", age: 6, interests: ["Music"], deviceName: "d",
  screenTimeWeekday: 60, screenTimeWeekend: 60, appleArcade: false, createdAt: now, updatedAt: now, ...o,
});
const app = (o: Partial<App> = {}): App => ({
  id: 1, name: "A", appStoreUrl: "u", category: "Music", ageMin: 4, ageMax: 8, interestTags: ["Music"],
  costModel: "Free", adStatus: "No Ads", notes: "", lastVerified: "2026-01-01", status: "Active",
  createdAt: now, updatedAt: now, ...o,
});

describe("appMatchesChild", () => {
  it("matches when the age is in range and an interest is shared", () => {
    expect(appMatchesChild(app(), child())).toBe(true);
  });

  it("treats the age range as inclusive at both ends", () => {
    expect(appMatchesChild(app(), child({ age: 4 }))).toBe(true);
    expect(appMatchesChild(app(), child({ age: 8 }))).toBe(true);
    expect(appMatchesChild(app(), child({ age: 3 }))).toBe(false);
    expect(appMatchesChild(app(), child({ age: 9 }))).toBe(false);
  });

  it("needs at least one shared interest", () => {
    expect(appMatchesChild(app({ interestTags: ["Math"] }), child())).toBe(false);
    expect(appMatchesChild(app({ interestTags: ["Math", "Music"] }), child())).toBe(true);
  });

  it("never matches a child with no interests or an app with no tags", () => {
    expect(appMatchesChild(app(), child({ interests: [] }))).toBe(false);
    expect(appMatchesChild(app({ interestTags: [] }), child())).toBe(false);
  });

  it("does not confuse the Games category with the Gaming interest", () => {
    expect(appMatchesChild(app({ category: "Games", interestTags: ["Drawing"] }), child({ interests: ["Gaming"] }))).toBe(false);
  });
});

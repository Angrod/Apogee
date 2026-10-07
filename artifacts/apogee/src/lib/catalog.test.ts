import { describe, expect, it } from "vitest";
import { toggled } from "@/components/form-field";
import { CATEGORIES, INSTALL_STATUSES, INTEREST_TAGS } from "./catalog";

describe("option lists", () => {
  it("come from the API contract", () => {
    expect(INTEREST_TAGS).toContain("Baking/Food");
    expect(CATEGORIES).toEqual(["Games", "Education", "Creative", "Music", "Reading"]);
    // Legacy statuses must not come back.
    expect(INSTALL_STATUSES).not.toContain("Blocked");
  });
});

describe("toggled", () => {
  it("adds a missing value and removes a present one without mutating", () => {
    const tags = ["Music"];
    expect(toggled(tags, "Drawing")).toEqual(["Music", "Drawing"]);
    expect(toggled(tags, "Music")).toEqual([]);
    expect(tags).toEqual(["Music"]);
  });
});

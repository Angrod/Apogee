import type { App, Child } from "@workspace/db";

// The recommendation rule (see docs/HANDOFF.md §6): an active catalog app
// matches a child when the child's age is inside the app's inclusive range
// and they share at least one interest tag. Callers pass only Active apps.
export function appMatchesChild(app: App, child: Child): boolean {
  if (child.age < app.ageMin || child.age > app.ageMax) return false;
  return app.interestTags.some((tag) => child.interests.includes(tag));
}

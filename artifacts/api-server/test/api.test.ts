import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { appInput, childInput, db, startApi } from "./helpers";

let api: Awaited<ReturnType<typeof startApi>>;
beforeAll(async () => {
  api = await startApi();
});
afterAll(async () => {
  await api.close();
  await db.pool.end();
});

const create = async (path: string, body: unknown) => {
  const res = await api.call("POST", path, body);
  expect(res.status).toBe(201);
  return res.json;
};

describe("children", () => {
  it("creates, reads, and fully replaces a profile", async () => {
    const c = await create("/children", childInput({ screenTimeWeekday: 75 }));
    expect(c.screenTimeWeekday).toBe(75);

    const got = await api.call("GET", `/children/${c.id}`);
    expect(got.json.name).toBe(c.name);

    const updated = await api.call("PUT", `/children/${c.id}`, childInput({ name: c.name, age: 7 }));
    expect(updated.status).toBe(200);
    expect(updated.json.age).toBe(7);
    expect(new Date(updated.json.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(c.updatedAt).getTime());
  });

  it("rejects a partial PUT instead of resetting missing fields", async () => {
    const c = await create("/children", childInput());
    const res = await api.call("PUT", `/children/${c.id}`, { name: "Only a name" });
    expect(res.status).toBe(400);
    expect(res.json.details).toEqual(expect.arrayContaining(["age: Required"]));
    expect((await api.call("GET", `/children/${c.id}`)).json.name).toBe(c.name);
  });

  it.each([
    ["unknown interest", { interests: ["Knitting"] }],
    ["fractional age", { age: 5.5 }],
    ["age 0", { age: 0 }],
    ["age 18", { age: 18 }],
    ["screen time over 24h", { screenTimeWeekday: 1441 }],
    ["negative screen time", { screenTimeWeekend: -1 }],
    ["empty name", { name: "" }],
  ])("rejects %s with a 400", async (_label, overrides) => {
    const res = await api.call("POST", "/children", childInput(overrides));
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Invalid request");
  });
});

describe("archiving children", () => {
  it("hides archived profiles from the default list and the dashboard, keeping their data", async () => {
    const kid = await create("/children", childInput({ interests: ["Science"] }));
    const a = await create("/apps", appInput({ interestTags: ["Science"] }));
    await api.call("PUT", `/child-app-status/${kid.id}/${a.id}`, { status: "Installed" });

    const archived = await api.call("PUT", `/children/${kid.id}`, childInput({ name: kid.name, interests: ["Science"], archived: true }));
    expect(archived.status).toBe(200);
    expect(archived.json.archived).toBe(true);

    const listIds = async (q: string) => (await api.call("GET", `/children${q}`)).json.map((c: { id: number }) => c.id);
    expect(await listIds("")).not.toContain(kid.id);
    expect(await listIds("?includeArchived=false")).not.toContain(kid.id);
    expect(await listIds("?includeArchived=true")).toContain(kid.id);

    const dashboardIds = async () => (await api.call("GET", "/dashboard")).json.map((e: any) => e.child.id);
    expect(await dashboardIds()).not.toContain(kid.id);

    // Unarchive: the profile and its statuses come back untouched.
    await api.call("PUT", `/children/${kid.id}`, childInput({ name: kid.name, interests: ["Science"], archived: false }));
    const entry = (await api.call("GET", "/dashboard")).json.find((e: any) => e.child.id === kid.id);
    expect(entry.matchedApps.find((m: any) => m.app.id === a.id).childStatus).toBe("Installed");
  });

  it("requires archived on PUT so it can't be silently reset", async () => {
    const kid = await create("/children", childInput());
    const { archived: _a, ...withoutArchived } = childInput({ name: kid.name });
    const res = await api.call("PUT", `/children/${kid.id}`, withoutArchived);
    expect(res.status).toBe(400);
    expect(res.json.details).toContain("archived: Required");
  });
});

describe("catalog", () => {
  it("rejects bad apps", async () => {
    for (const overrides of [
      { ageMin: 9, ageMax: 3 },
      { appStoreUrl: "not-a-url" },
      { category: "Toys" },
      { costModel: "Freemium" },
    ]) {
      expect((await api.call("POST", "/apps", appInput(overrides))).status).toBe(400);
    }
    const { notes: _n, status: _s, ...withoutNotesAndStatus } = appInput();
    expect((await api.call("POST", "/apps", withoutNotesAndStatus)).status).toBe(400);
  });

  it("soft-deletes: Removed apps keep their record and only list with includeRemoved=true", async () => {
    const a = await create("/apps", appInput({ notes: "why we picked it" }));
    await api.call("PUT", `/apps/${a.id}`, appInput({ name: a.name, notes: a.notes, status: "Removed" }));

    const ids = async (q: string) => (await api.call("GET", `/apps${q}`)).json.map((x: { id: number }) => x.id);
    expect(await ids("")).not.toContain(a.id);
    expect(await ids("?includeRemoved=false")).not.toContain(a.id);
    expect(await ids("?includeRemoved=true")).toContain(a.id);
    expect((await api.call("GET", `/apps/${a.id}`)).json.notes).toBe("why we picked it");
  });

  it("filters by category and interest tag", async () => {
    await create("/apps", appInput({ category: "Education", interestTags: ["Engineering"] }));
    const res = await api.call("GET", "/apps?category=Education&interestTag=Engineering");
    expect(res.json.length).toBeGreaterThan(0);
    for (const x of res.json) {
      expect(x.category).toBe("Education");
      expect(x.interestTags).toContain("Engineering");
    }
    expect((await api.call("GET", "/apps?category=Toys")).status).toBe(400);
  });

  it("has no hard-delete endpoints", async () => {
    const a = await create("/apps", appInput());
    expect((await api.call("DELETE", `/apps/${a.id}`)).status).toBe(404);
    expect((await api.call("GET", `/apps/${a.id}`)).status).toBe(200);
  });
});

describe("per-child status", () => {
  it("upserts one row per child/app pair, and siblings stay independent", async () => {
    const tag = { interests: ["Science"] };
    const older = await create("/children", childInput(tag));
    const younger = await create("/children", childInput(tag));
    const a = await create("/apps", appInput({ interestTags: ["Science"] }));

    const first = await api.call("PUT", `/child-app-status/${older.id}/${a.id}`, { status: "Pushed" });
    const second = await api.call("PUT", `/child-app-status/${older.id}/${a.id}`, { status: "Installed" });
    expect(second.json.id).toBe(first.json.id);
    expect(second.json.status).toBe("Installed");

    const dash = (await api.call("GET", "/dashboard")).json;
    const statusFor = (childId: number) =>
      dash.find((e: any) => e.child.id === childId).matchedApps.find((m: any) => m.app.id === a.id).childStatus;
    expect(statusFor(older.id)).toBe("Installed");
    expect(statusFor(younger.id)).toBe("Not Installed");
  });

  it("survives simultaneous first writes", async () => {
    const c = await create("/children", childInput());
    const a = await create("/apps", appInput());
    const results = await Promise.all(
      Array.from({ length: 5 }, () => api.call("PUT", `/child-app-status/${c.id}/${a.id}`, { status: "Pushed" })),
    );
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
  });

  it("validates the status and the pair", async () => {
    const c = await create("/children", childInput());
    const a = await create("/apps", appInput());
    expect((await api.call("PUT", `/child-app-status/${c.id}/${a.id}`, { status: "Blocked" })).status).toBe(400);
    expect((await api.call("PUT", `/child-app-status/${c.id}/999999`, { status: "Pushed" })).status).toBe(404);
  });
});

describe("dashboard", () => {
  it("matches by age (inclusive) and interest, and excludes Removed apps until restored", async () => {
    const c = await create("/children", childInput({ age: 8, interests: ["Reading"] }));
    const edge = await create("/apps", appInput({ ageMin: 8, ageMax: 8, interestTags: ["Reading"] }));
    const tooOld = await create("/apps", appInput({ ageMin: 9, ageMax: 12, interestTags: ["Reading"] }));
    const noShared = await create("/apps", appInput({ ageMin: 8, ageMax: 8, interestTags: ["Math"] }));

    const matched = async () =>
      (await api.call("GET", "/dashboard")).json
        .find((e: any) => e.child.id === c.id)
        .matchedApps.map((m: any) => m.app.id);

    expect(await matched()).toEqual(expect.arrayContaining([edge.id]));
    expect(await matched()).not.toContain(tooOld.id);
    expect(await matched()).not.toContain(noShared.id);

    await api.call("PUT", `/apps/${edge.id}`, appInput({ ...edge, status: "Removed" }));
    expect(await matched()).not.toContain(edge.id);
    await api.call("PUT", `/apps/${edge.id}`, appInput({ ...edge, status: "Active" }));
    expect(await matched()).toContain(edge.id);
  });

  it("creates a Not Installed status row for new matches", async () => {
    const c = await create("/children", childInput({ interests: ["Language Learning"] }));
    const a = await create("/apps", appInput({ interestTags: ["Language Learning"] }));
    await api.call("GET", "/dashboard");
    const exported = (await api.call("GET", "/export")).json;
    const row = exported.childAppStatuses.find((s: any) => s.childId === c.id && s.appId === a.id);
    expect(row?.status).toBe("Not Installed");
  });
});

describe("export", () => {
  it("includes all three collections, Removed apps included", async () => {
    const removed = await create("/apps", appInput({ status: "Removed" }));
    const res = await api.call("GET", "/export");
    expect(Object.keys(res.json).sort()).toEqual(["apps", "childAppStatuses", "children"]);
    expect(res.json.apps.map((a: any) => a.id)).toContain(removed.id);
  });
});

describe("errors", () => {
  it.each([
    ["GET", "/children/abc", 400],
    ["GET", "/children/1.5", 400],
    ["GET", "/children/0", 400],
    ["GET", "/children/999999", 404],
    ["GET", "/nope", 404],
  ])("%s %s -> %i with a JSON body", async (method, path, status) => {
    const res = await api.call(method, path);
    expect(res.status).toBe(status);
    expect(res.json?.error).toEqual(expect.any(String));
  });

  it("rejects malformed JSON with a 400", async () => {
    const res = await api.call("POST", "/children", undefined, '{"name":');
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Malformed JSON body");
  });
});

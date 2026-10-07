import { afterAll, describe, expect, it } from "vitest";
import { db } from "./helpers";

// The database enforces the rules on its own, even for writes that skip the API.
const { pool } = db;
afterAll(() => pool.end());

const insertApp = (cols: Record<string, unknown>) => {
  const row = {
    name: "x", app_store_url: "https://example.com", category: "Games", age_min: 1, age_max: 2,
    cost_model: "Free", ad_status: "No Ads", ...cols,
  };
  const keys = Object.keys(row);
  return pool.query(
    `insert into apps (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")}) returning id`,
    Object.values(row),
  );
};

describe("database constraints", () => {
  it.each([
    ["unknown category", { category: "Toys" }, /invalid input value for enum category/],
    ["unknown cost model", { cost_model: "Freemium" }, /invalid input value for enum cost_model/],
    ["age_min > age_max", { age_min: 9, age_max: 2 }, /apps_age_order/],
    ["age out of range", { age_max: 18 }, /apps_age_range/],
  ])("apps: rejects %s", async (_label, cols, message) => {
    await expect(insertApp(cols)).rejects.toThrow(message);
  });

  it("children: rejects unknown interests and out-of-range values", async () => {
    await expect(
      pool.query(`insert into children (name, age, interests, device_name) values ('x', 5, '{Knitting}', 'd')`),
    ).rejects.toThrow(/invalid input value for enum interest_tag/);
    await expect(
      pool.query(`insert into children (name, age, device_name) values ('x', 0, 'd')`),
    ).rejects.toThrow(/children_age_range/);
    await expect(
      pool.query(`insert into children (name, age, device_name, screen_time_weekday) values ('x', 5, 'd', 2000)`),
    ).rejects.toThrow(/children_screen_time_weekday_range/);
  });

  it("child_app_status: one row per pair, valid statuses and references only", async () => {
    const child = await pool.query(`insert into children (name, age, device_name) values ('x', 5, 'd') returning id`);
    const app = await insertApp({});
    const [c, a] = [child.rows[0].id, app.rows[0].id];

    await pool.query(`insert into child_app_status (child_id, app_id, status) values ($1, $2, 'Pushed')`, [c, a]);
    await expect(
      pool.query(`insert into child_app_status (child_id, app_id, status) values ($1, $2, 'Installed')`, [c, a]),
    ).rejects.toThrow(/child_app_status_child_id_app_id_unique/);
    await expect(
      pool.query(`insert into child_app_status (child_id, app_id, status) values ($1, $2, 'Blocked')`, [c, a]),
    ).rejects.toThrow(/invalid input value for enum install_status/);
    await expect(
      pool.query(`insert into child_app_status (child_id, app_id) values ($1, 999999)`, [c]),
    ).rejects.toThrow(/foreign key constraint/);
  });
});

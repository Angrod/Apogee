import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // All files share one test database.
    fileParallelism: false,
    env: { LOG_LEVEL: "silent", NODE_ENV: "test" },
  },
});

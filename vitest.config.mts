import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: {
      // Test-only values — not real secrets.
      BETTER_AUTH_SECRET: "test-only-secret-not-used-anywhere-0123456789",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});

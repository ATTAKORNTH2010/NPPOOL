import { describe, expect, it } from "vitest";
import { baseURL, trustedOrigins } from "@/lib/auth/options";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

const vercel = {
  VERCEL_URL: "nppool-abc123.vercel.app",
  VERCEL_BRANCH_URL: "nppool-git-feature.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL: "nppool.vercel.app",
};

describe("auth base URL", () => {
  it("prefers BETTER_AUTH_URL", () => {
    expect(baseURL(env({ ...vercel, VERCEL_ENV: "production", BETTER_AUTH_URL: "https://np.example.com" }))).toBe(
      "https://np.example.com",
    );
  });

  it("uses the branch URL on a Preview", () => {
    expect(baseURL(env({ ...vercel, VERCEL_ENV: "preview" }))).toBe("https://nppool-git-feature.vercel.app");
  });

  it("uses the production URL in Production", () => {
    expect(baseURL(env({ ...vercel, VERCEL_ENV: "production" }))).toBe("https://nppool.vercel.app");
  });

  it("falls back to localhost on a developer machine", () => {
    expect(baseURL(env({}))).toBe("http://localhost:3000");
  });
});

describe("trusted origins", () => {
  it("trusts every URL of the deployment and not localhost in production", () => {
    expect(trustedOrigins(env({ ...vercel, NODE_ENV: "production" }))).toEqual([
      "https://nppool-abc123.vercel.app",
      "https://nppool-git-feature.vercel.app",
      "https://nppool.vercel.app",
    ]);
  });

  it("adds localhost outside production", () => {
    expect(trustedOrigins(env({ NODE_ENV: "development" }))).toEqual(["http://localhost:3000"]);
  });
});

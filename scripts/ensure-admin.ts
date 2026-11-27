/**
 * Creates the first admin account if it does not exist yet (ADR-0011).
 *
 * Reads ADMIN_USERNAME, ADMIN_PASSWORD and optional ADMIN_NAME from the
 * environment. Does nothing when they are not set or the user already exists,
 * so it is safe in every build. Never prints the password.
 *
 *   npm run admin:ensure
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createAuth } from "@/lib/auth/config";
import { syntheticEmail } from "@/lib/auth/options";
import { passwordSchema, usernameSchema } from "@/lib/auth/password-policy";

async function main() {
  const rawUsername = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "ผู้ดูแลระบบ";

  if (!rawUsername || !password) {
    console.log("admin: ADMIN_USERNAME / ADMIN_PASSWORD not set — skipping");
    return;
  }

  const parsedUsername = usernameSchema.safeParse(rawUsername);
  if (!parsedUsername.success) {
    throw new Error(`ADMIN_USERNAME: ${parsedUsername.error.issues.map((i) => i.message).join(", ")}`);
  }
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    throw new Error(`ADMIN_PASSWORD: ${parsedPassword.error.issues.map((i) => i.message).join(", ")}`);
  }

  const displayUsername = parsedUsername.data;
  const username = displayUsername.toLowerCase();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    console.log(`admin: "${username}" already exists — nothing to do`);
    return;
  }

  const auth = createAuth(db);
  await auth.api.createUser({
    body: {
      email: syntheticEmail(username),
      password: parsedPassword.data,
      name,
      role: "admin",
      data: { username, displayUsername },
    },
  });
  console.log(`admin: created "${username}"`);
}

main()
  .catch((error: unknown) => {
    console.error("admin bootstrap failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());

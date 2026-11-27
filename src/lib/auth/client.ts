"use client";

import { adminClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./roles";

export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient({ ac, roles })],
});

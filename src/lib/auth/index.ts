import { db } from "@/db/client";
import { createAuth } from "./config";

export const auth = createAuth(db);

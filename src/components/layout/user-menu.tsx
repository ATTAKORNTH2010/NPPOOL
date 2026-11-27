import { requireUser } from "@/lib/dal";
import { ROLE_LABELS } from "@/lib/permissions";
import { UserMenuButton } from "./user-menu-button";

/** Reads the session → keep inside <Suspense>. Passes only display fields to the client. */
export async function UserMenu() {
  const user = await requireUser();
  return <UserMenuButton name={user.name} username={user.username} roleLabel={ROLE_LABELS[user.role]} />;
}

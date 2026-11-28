import { describePage } from "@/features/activity/catalog";
import { logPageView } from "@/features/activity/log";
import { getCurrentUser } from "@/lib/dal";

/**
 * POST /api/activity { path } — a signed-in user opened a page (ADR-0012).
 * Only known pages are logged, and the same user opening the same page again
 * within a few minutes counts once. Always 204, so the beacon never shows an
 * error to the user.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const user = await getCurrentUser();
  if (!user) return done;

  const body: unknown = await request.json().catch(() => null);
  const path = body && typeof body === "object" && "path" in body && typeof body.path === "string" ? body.path : "";
  const page = path.length <= 200 ? describePage(path) : null;
  if (!page) return done;

  logPageView(
    { userId: user.id, module: page.module, action: page.action, entityId: page.entityId, detail: page.name, path },
    request.headers,
  );
  return done;
}

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only (ADR-0009): no session cookie → go to /login.
 * The cookie is not validated here; every page and Server Action verifies
 * the session and the role on the server (src/lib/dal.ts).
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the login page, the auth API, Next.js assets and static files.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

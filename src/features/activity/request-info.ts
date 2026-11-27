/** Client address as Vercel forwards it, and the user agent (ADR-0012). Pure. */
export function requestInfo(headers: Headers | undefined | null): { ipAddress: string | null; userAgent: string | null } {
  if (!headers) return { ipAddress: null, userAgent: null };
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ipAddress: headers.get("x-real-ip") ?? (forwarded || null),
    userAgent: headers.get("user-agent"),
  };
}

/**
 * Activity log storage and the admin view (ADR-0012). No Next.js imports, so
 * integration tests run it on PGlite.
 */
import { and, count, desc, eq, gte, isNotNull, lt, max, sql, type SQL } from "drizzle-orm";
import { activityLogs, users } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { bangkokDayEnd, bangkokDayStart, isYmd, orderedRange } from "@/lib/date-range";
import { sortByThai } from "@/lib/thai-sort";
import {
  ACTIVITY_RETENTION_MONTHS,
  isActivityAction,
  isActivityModule,
  type ActivityAction,
  type ActivityModule,
} from "./catalog";

export const ACTIVITY_PAGE_SIZE = 50;

export type ActivityEntry = {
  userId: string | null;
  module: ActivityModule;
  action: ActivityAction;
  entityId?: string | number | null;
  detail?: string | null;
  path?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  occurredAt?: Date;
};

const clip = (value: string | null | undefined, maxLength: number) => (value ? value.slice(0, maxLength) : null);

export async function recordActivity(db: AppDatabase, entry: ActivityEntry): Promise<void> {
  await db.insert(activityLogs).values({
    userId: entry.userId,
    module: entry.module,
    action: entry.action,
    entityId: entry.entityId === null || entry.entityId === undefined ? null : clip(String(entry.entityId), 200),
    detail: clip(entry.detail, 500),
    path: clip(entry.path, 200),
    ipAddress: clip(entry.ipAddress, 64),
    userAgent: clip(entry.userAgent, 300),
    ...(entry.occurredAt ? { occurredAt: entry.occurredAt } : {}),
  });
}

/**
 * Opening the same page again within this many minutes counts once (ADR-0012).
 * The check runs on the server, per user: one browser tab can be used by
 * several people in turn (sign out → sign in), so the browser cannot do it.
 */
export const PAGE_VIEW_REPEAT_MINUTES = 5;

export type PageView = ActivityEntry & { userId: string; path: string };

/** Writes a page view unless the same user opened the same path within the repeat window. True when written. */
export async function recordPageView(db: AppDatabase, view: PageView): Promise<boolean> {
  const at = view.occurredAt ?? new Date();
  const since = new Date(at.getTime() - PAGE_VIEW_REPEAT_MINUTES * 60_000);
  const [recent] = await db
    .select({ id: activityLogs.id })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, view.userId),
        eq(activityLogs.action, view.action),
        eq(activityLogs.path, view.path),
        gte(activityLogs.occurredAt, since),
      ),
    )
    .limit(1);
  if (recent) return false;
  await recordActivity(db, { ...view, occurredAt: at });
  return true;
}

/**
 * Deletes entries older than the retention window and returns how many went.
 * They are an audit trail, not business rows, so ADR-0010's no-hard-delete
 * rule does not cover them (ADR-0012).
 */
export async function purgeExpiredActivity(db: AppDatabase, now: Date = new Date()): Promise<number> {
  const cutoff = sql`${now.toISOString()}::timestamptz - make_interval(months => ${ACTIVITY_RETENTION_MONTHS}::int)`;
  const removed = await db
    .delete(activityLogs)
    .where(lt(activityLogs.occurredAt, cutoff))
    .returning({ id: activityLogs.id });
  return removed.length;
}

// ----------------------------------------------------------------- admin view

export type ActivityFilters = {
  userId: string | null;
  module: ActivityModule | null;
  action: ActivityAction | null;
  /** Thai-time days "YYYY-MM-DD", both ends included */
  from: string | null;
  to: string | null;
};

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: Params, key: string): string {
  const value = params instanceof URLSearchParams ? params.get(key) : params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.trim() : "";
}

export function parseActivityFilters(params: Params): ActivityFilters {
  const userId = read(params, "user");
  const moduleKey = read(params, "module");
  const action = read(params, "action");
  const [from, to] = orderedRange(
    isYmd(read(params, "from")) ? read(params, "from") : null,
    isYmd(read(params, "to")) ? read(params, "to") : null,
  );
  return {
    userId: /^[\w-]{1,64}$/.test(userId) ? userId : null,
    module: isActivityModule(moduleKey) ? moduleKey : null,
    action: isActivityAction(action) ? action : null,
    from,
    to,
  };
}

function conditions(filters: ActivityFilters): SQL | undefined {
  const list: SQL[] = [];
  if (filters.userId) list.push(eq(activityLogs.userId, filters.userId));
  if (filters.module) list.push(eq(activityLogs.module, filters.module));
  if (filters.action) list.push(eq(activityLogs.action, filters.action));
  if (filters.from) list.push(gte(activityLogs.occurredAt, bangkokDayStart(filters.from)));
  if (filters.to) list.push(lt(activityLogs.occurredAt, bangkokDayEnd(filters.to)));
  return list.length > 0 ? and(...list) : undefined;
}

export type ActivityRow = {
  id: number;
  occurredAt: Date;
  userName: string | null;
  username: string | null;
  module: string;
  action: string;
  entityId: string | null;
  detail: string | null;
  path: string | null;
  ipAddress: string | null;
};

/** Newest first, 50 per page; out-of-range pages are clamped. */
export async function listActivity(
  db: AppDatabase,
  filters: ActivityFilters,
  requestedPage: number,
): Promise<{ rows: ActivityRow[]; page: number; pageCount: number; total: number }> {
  const where = conditions(filters);
  const [totalRow] = await db.select({ total: count() }).from(activityLogs).where(where);
  const total = totalRow?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage) || 1), pageCount);

  const rows = await db
    .select({
      id: activityLogs.id,
      occurredAt: activityLogs.occurredAt,
      userName: users.name,
      username: users.displayUsername,
      module: activityLogs.module,
      action: activityLogs.action,
      entityId: activityLogs.entityId,
      detail: activityLogs.detail,
      path: activityLogs.path,
      ipAddress: activityLogs.ipAddress,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(where)
    .orderBy(desc(activityLogs.occurredAt), desc(activityLogs.id))
    .limit(ACTIVITY_PAGE_SIZE)
    .offset((page - 1) * ACTIVITY_PAGE_SIZE);
  return { rows, page, pageCount, total };
}

export type ActivitySummaryRow = {
  userId: string;
  userName: string;
  /** module key → number of log entries */
  counts: Record<string, number>;
  total: number;
  lastAt: Date | null;
};

/** “Who used which function, how often” for the same filters (user and module filters apply too). */
export async function summarizeActivity(db: AppDatabase, filters: ActivityFilters): Promise<ActivitySummaryRow[]> {
  const where = and(isNotNull(activityLogs.userId), conditions(filters));
  const rows = await db
    .select({
      userId: activityLogs.userId,
      userName: users.name,
      module: activityLogs.module,
      count: count(),
      lastAt: max(activityLogs.occurredAt),
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.userId, users.id))
    .where(where)
    .groupBy(activityLogs.userId, users.name, activityLogs.module);

  const byUser = new Map<string, ActivitySummaryRow>();
  for (const row of rows) {
    if (!row.userId) continue;
    const entry = byUser.get(row.userId) ?? { userId: row.userId, userName: row.userName, counts: {}, total: 0, lastAt: null };
    entry.counts[row.module] = row.count;
    entry.total += row.count;
    if (row.lastAt && (!entry.lastAt || row.lastAt > entry.lastAt)) entry.lastAt = row.lastAt;
    byUser.set(row.userId, entry);
  }
  return sortByThai([...byUser.values()], (row) => row.userName);
}

/** Everyone who can appear in the log, for the user filter. */
export async function listActivityUsers(db: AppDatabase): Promise<{ id: string; name: string }[]> {
  const rows = await db.select({ id: users.id, name: users.name }).from(users);
  return sortByThai(rows, (row) => row.name);
}

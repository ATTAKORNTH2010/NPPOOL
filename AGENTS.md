<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## NP Pool project rules

- Read `plan.md`, `Roadmap.md` and `skill.md` first. Work one phase at a time and stop at every ⏸ approval gate.
- The legacy system at `C:\Projects\NPPool` is read-only reference: never modify it and never copy its files into this repo.
- Public repo: never commit secrets, connection strings, customer data or personal data. Record only which file holds a secret.
- Cache Components is on: anything that reads the session (`src/lib/dal.ts`) must sit inside `<Suspense>`, and prerendered components must not call `Math.random()` or `Date.now()` (shadcn's `SidebarMenuSkeleton` does).
- Authorization is deny by default (ADR-0009): every page and Server Action calls `requireUser()` / `requirePermission()`; `src/proxy.ts` is only an optimistic cookie check.
- Sessions follow BR-AU-03 (30 minutes, sliding): see `src/lib/auth/session-policy.ts` before changing session options.
- Schema changes: edit `src/db/schema/*` → `npm run db:generate` → review the SQL in `drizzle/` → commit both. Never hard-delete business rows (ADR-0010).
- Before committing: `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` must pass.

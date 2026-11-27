import { Truck } from "lucide-react";
import { SITE } from "@/config/site";

/**
 * Compact brand mark for the sidebar. The company logo (./logo.tsx) is a wide
 * 215×81 banner that does not fit the collapsed icon rail, so the sidebar keeps
 * this square icon; the login page and the printed job order show the logo.
 */
export function Brand() {
  return (
    <>
      <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Truck className="size-4" />
      </span>
      <span className="grid flex-1 text-left leading-tight">
        <span className="truncate font-semibold">{SITE.name}</span>
        <span className="truncate text-xs text-muted-foreground">{SITE.tagline}</span>
      </span>
    </>
  );
}

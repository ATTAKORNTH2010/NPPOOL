import { Truck } from "lucide-react";
import { SITE } from "@/config/site";

/**
 * Text brand mark. The official NP Pool logo file will replace the icon once
 * the user provides it (it is not copied from the legacy folder).
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

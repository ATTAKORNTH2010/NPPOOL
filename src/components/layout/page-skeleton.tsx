import { Skeleton } from "@/components/ui/skeleton";

/** Static-shell placeholder while a page checks the session. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="กำลังโหลด">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

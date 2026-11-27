import { Badge } from "@/components/ui/badge";
import { WORK_STATUS } from "../statuses";

/** Cancelled work orders stay listed with a grey badge (design 02 §3.2). */
export function WorkStatusBadge({ code, name }: { code: number; name: string }) {
  if (code === WORK_STATUS.CANCELLED) {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        {name}
      </Badge>
    );
  }
  return <Badge variant={code === WORK_STATUS.OPEN ? "default" : "outline"}>{name}</Badge>;
}

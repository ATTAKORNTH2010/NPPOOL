import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

/** Shown instead of a page when its work order was deleted or can no longer be changed. */
export function WorkOrderNotice({ title, description, href = "/work-orders", linkText = "กลับไปรายการใบงาน" }: {
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="grid gap-4">
      <Alert>
        <AlertTitle>{title}</AlertTitle>
        {description ? <AlertDescription>{description}</AlertDescription> : null}
      </Alert>
      <div>
        <Link href={href} className={buttonVariants({ variant: "outline" })}>
          {linkText}
        </Link>
      </div>
    </div>
  );
}

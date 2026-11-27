import Image from "next/image";
import logo from "@/assets/brand/np-pool-logo.png";

/**
 * Company logo, copied from the legacy system with the owner's approval
 * (Roadmap B8, 2026-11-27). The file is only 215×81 px, so show it at that
 * size or smaller. It loads eagerly and unoptimized: it is tiny, and the print
 * page must have it before the print dialog opens.
 */
export function Logo({ className }: { className?: string }) {
  return <Image src={logo} alt="N.P. Pool Group" loading="eager" unoptimized className={className} />;
}

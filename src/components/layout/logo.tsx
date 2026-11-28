import Image from "next/image";
import logo from "@/assets/brand/np-pool-logo.jpeg";

/**
 * Company logo: the owner's NPPOOL-LOGO.jpeg (2026-11-28, Roadmap D39), which
 * replaced the legacy logo. It is 331×172 px on a white background, so put it
 * on white: paper when printed, a light badge on screen. It loads eagerly and
 * unoptimized: it is small (20 KB), and the print page must have it before
 * the print dialog opens.
 */
export function Logo({ className }: { className?: string }) {
  return <Image src={logo} alt="N.P. Pool Group" loading="eager" unoptimized className={className} />;
}

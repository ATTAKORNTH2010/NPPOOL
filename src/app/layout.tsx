import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Thai UI font, self-hosted by next/font at build time (ADR-0006).
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "NP Pool", template: "%s · NP Pool" },
  description: "ระบบจัดการงานขนส่ง NP Pool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

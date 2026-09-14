import type { Metadata } from "next";
import WhitepaperClient from "@/components/WhitepaperClient";

export const metadata: Metadata = {
  title: "Whitepaper — Illuminati",
  description:
    "Illuminati — Pre-Launch Whitepaper. The mystical platform on Base: sigils, astrology, coaching. ILLUM governance token. illuminati.co",
  robots: { index: false, follow: false },
};

export default function WhitepaperPage() {
  return <WhitepaperClient />;
}
